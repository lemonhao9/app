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
    const picture = data.picture ?? current.picture;
    if (data.picture && current.picture && data.picture !== current.picture) {
        deletePhotoFile(current.picture)
    }
    const updated = await userRepository.update(userId, {
        name: data.name ?? current.name,
        phone: data.phone ?? current.phone,
        picture,
    });
    return toSafeUser(updated);
}