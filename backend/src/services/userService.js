import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import * as userRepository from '../repositories/userRepository.js';
import { deletePhotoFile } from '../utils/fileStorage.js';
import { toSafeUser } from './authServices.js'
import { getClient } from '../utils/db.js'
import * as bikeRepository from '../repositories/bikeRepository.js';
import * as interventionRepository from '../repositories/interventionRepository.js';

const SALT_ROUNDS = 12;
const TEMP_PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
const TEMP_PASSWORD_LENGTH = 12;

export function generateTemporaryPassword() {
    return Array.from(
        { length: TEMP_PASSWORD_LENGTH },
        () => TEMP_PASSWORD_ALPHABET[randomInt(TEMP_PASSWORD_ALPHABET.length)]
    ).join('');
}

export async function createTechnician({ email, name, phone }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
        const err = new Error('Email déjà utilisé');
        err.status = 409;
        throw err;
    }
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);
    try {
        const user = await userRepository.createWithTemporaryPassword({ email, passwordHash, name, phone: phone ?? null, role: 'technician' });
        return { user, temporaryPassword };
    } catch (err) {
        if (err.code === '23505') {
            const conflict = new Error('Email déjà utilisé');
            conflict.status = 409;
            throw conflict;
        }
        throw err;
    }
}

export async function regenerateTemporaryPassword(userId) {
    const user = await userRepository.findById(userId);
    if (!user || user.role !== 'technician') {
        const err = new Error('Technicien introuvable');
        err.status = 404;
        throw err;
    }
    if (!user.is_active) {
        const err = new Error('Ce compte est désactivé : réactivez-le avant de générer un mot de passe provisoire');
        err.status = 409;
        throw err;
    }
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);
    const updated = await userRepository.resetTemporaryPassword(userId, passwordHash);
    if (!updated) {
        const err = new Error('Technicien introuvable');
        err.status = 404;
        throw err;
    }
    return { user: updated, temporaryPassword };
}

async function findManageableUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
        const err = new Error('Utilisateur introuvable');
        err.status = 404;
        throw err;
    }
    if (user.deleted_at) {
        const err = new Error('Ce compte a été supprimé : il ne peut plus être modifié');
        err.status = 409;
        throw err;
    }
    return user;
}

export async function updateUserByAdmin(userId, data) {
    const current = await findManageableUser(userId);
    const email = data.email ?? current.email;
    if (email !== current.email) {
        const existing = await userRepository.findByEmail(email);
        if (existing && existing.user_id !== userId) {
            const err = new Error('Email déjà utilisé');
            err.status = 409;
            throw err;
        }
    }
    let updated;
    try {
        updated = await userRepository.updateIdentity(userId, {
            name: data.name ?? current.name,
            email,
            phone: data.phone !== undefined ? data.phone : current.phone,
        });
    } catch (err) {
        if (err.code === '23505') {
            const conflict = new Error('Email déjà utilisé');
            conflict.status = 409;
            throw conflict;
        }
        throw err;
    }
    if (!updated) {
        const err = new Error('Utilisateur introuvable');
        err.status = 404;
        throw err;
    }
    return toSafeUser(updated);
}

export async function deactivateUser(adminId, userId) {
    if (adminId === userId) {
        const err = new Error('Vous ne pouvez pas désactiver votre propre compte');
        err.status = 409;
        throw err;
    }
    const user = await findManageableUser(userId);
    if (!user.is_active) return toSafeUser(user);
    const activeCount = await interventionRepository.countActiveByUserId(userId);
    if (activeCount > 0) {
        const err = new Error(`${activeCount} intervention(s) à venir ou en cours sont liées à ce compte : annulez-les ou réassignez-les avant de le désactiver`);
        err.status = 409;
        throw err;
    }
    const updated = await userRepository.setActive(userId, false);
    return toSafeUser(updated);
}

export async function activateUser(userId) {
    const user = await findManageableUser(userId);
    if (user.is_active) return toSafeUser(user);
    const updated = await userRepository.setActive(userId, true);
    return toSafeUser(updated);
}

export async function deleteAccount(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
        const err = new Error('Utilisateur introuvable');
        err.status = 404;
        throw err;
    }
    if (await interventionRepository.countInProgressByClientId(userId) > 0) {
        const err = new Error('Une intervention est en cours : vous pourrez supprimer votre compte une fois celle-ci terminée');
        err.status = 409;
        throw err;
    }
    const client = await getClient();
    let bikes;
    let photoUrls;
    try {
        await client.query('BEGIN');
        bikes = await bikeRepository.findByUserId(userId, client);
        await interventionRepository.cancelActiveByClientId(userId, client);
        photoUrls = await interventionRepository.removePhotosByClientId(userId, client);
        await interventionRepository.anonymizeAddressesByClientId(userId, client);
        await bikeRepository.removeUnreferencedByUserId(userId, client);
        await bikeRepository.clearPhotosByUserId(userId, client);
        await userRepository.anonymize(userId, client);
        await userRepository.deleteAddresses(userId, client);
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
    const files = [user.picture, ...bikes.map(bike => bike.photo), ...photoUrls].filter(Boolean);
    await Promise.all(files.map(deletePhotoFile));
}

export async function updateProfile(userId, data) {
    const current = await userRepository.findById(userId);
    if(!current) {
        const err = new Error ('Utilisateur introuvable');
        err.status = 404;
        throw err;
    }

    let email = current.email;
    if (data.email && data.email !== current.email) {
        const existing = await userRepository.findByEmail(data.email);
        if (existing && existing.user_id !== userId) {
            const err = new Error('Email déjà utilisé');
            err.status = 409;
            throw err;
        }
        email = data.email;
    }

    let passwordHash = current.password_hash;
    if (data.newPassword) {
        const valid = await bcrypt.compare(data.currentPassword, current.password_hash);
        if (!valid) {
            const err = new Error('Mot de passe actuel incorrect');
            err.status = 401;
            throw err;
        }
        passwordHash = await bcrypt.hash(data.newPassword, SALT_ROUNDS);
    }

    const picture = data.picture ?? current.picture;
    if (data.picture && current.picture && data.picture !== current.picture) {
        deletePhotoFile(current.picture)
    }
    const updated = await userRepository.update(userId, {
        name: data.name ?? current.name,
        phone: data.phone ?? current.phone,
        picture,
        email,
        passwordHash,
    });
    return toSafeUser(updated);
}

export async function listUsers({ role, q, limit, offset } = {}) {
    const rows = await userRepository.findAll({ role, q, limit, offset });
    const hasMore = limit ? rows.length > limit : false;
    const users = (limit ? rows.slice(0, limit) : rows).map(toSafeUser);
    return { users, hasMore };
}

export async function listClients(filters) {
    const rows = await userRepository.findClients(filters);
    return {
        total: rows[0]?.total ?? 0,
        clients: rows.map(row => ({
            user_id: row.user_id,
            email: row.email,
            name: row.name,
            phone: row.phone,
            is_active: row.is_active,
            is_deleted: row.deleted_at != null,
            address_name: row.address_name,
            zone_name: row.zone_name,
            bike_count: row.bike_count,
        })),
    };
}

export async function listUserBikes(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
        const err = new Error('Utilisateur introuvable');
        err.status = 404;
        throw err;
    }
    return bikeRepository.findByUserId(userId);
}
