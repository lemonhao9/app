import bcrypt from 'bcryptjs';
import * as userRepository from '../repositories/userRepository.js';
import { deletePhotoFile } from '../utils/fileStorage.js';
import { toSafeUser } from './authServices.js'

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
    await userRepository.anonymize(userId);
    await userRepository.deleteAddresses(userId);
    await deletePhotoFile(user.picture);
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