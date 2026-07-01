import bcrypt from 'bcryptjs';
import * as userRepository from '../repositories/userRepository.js';

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
    await userRepository.anonymize(userId);
    await userRepository.deleteAddresses(userId);
}