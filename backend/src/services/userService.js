import bcrypt from 'bcryptjs';
import * as userRepository from '../repositories/userRepository.js';
import { deletePhotoFile } from '../utils/fileStorage.js';
import { toSafeUser } from './authServices.js'
import { getClient } from '../utils/db.js'
import * as bikeRepository from '../repositories/bikeRepository.js';
import * as interventionRepository from '../repositories/interventionRepository.js';

const SALT_ROUNDS = 12;

export async function createTechnician ({email, password, name}) {
    const existing = await userRepository.findByEmail(email);
    if(existing) {
        const err = new Error('Email déjà utilisé');
        err.status = 409;
        throw err;
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    return userRepository.create({email, passwordHash, name, role: 'technician'});
}

export async function deleteAccount(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
        const err = new Error('Utilisateur introuvable');
        err.status = 404;
        throw err;
    }
    const bikes = await bikeRepository.findByUserId(userId);
    const client = await getClient();
    let photoUrls;
    try {
        await client.query('BEGIN');
        await interventionRepository.cancelActiveByClientId(userId, client);
        photoUrls = await interventionRepository.removePhotosByClientId(userId, client);
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

export async function listUsers(role) {
    const users = await userRepository.findAll({ role });
    return users.map(toSafeUser);
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
