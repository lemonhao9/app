import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as userRepository from '../repositories/userRepository.js'
import * as addressRepository from '../repositories/addressRepository.js'
import { getClient } from '../utils/db.js';

const SALT_ROUNDS = 12;

function generateToken(user){
    return jwt.sign(
        {userId: user.user_id, role: user.role, email: user.email},
        process.env.JWT_SECRET,
        { expiresIn: '7d'}
    );
}
export async function signup({email, password, name, phone, address}) {
    const existing = await userRepository.findByEmail(email)
    if (existing) {
        const err = new Error('Email déjà utilisé');
        err.status = 409;
        throw err;
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const client = await getClient();
    let created;
    try{
        await client.query('BEGIN');
        created = await userRepository.create({email, passwordHash, name, phone: phone || null}, client);
        await addressRepository.create({addressName : address.label, city: address.city, postalCode: address.postcode, longitude: address.longitude, latitude: address.latitude, isDefault: true, userId: created.user_id}, client);
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
    const safeUser = toSafeUser(created);
    const token = generateToken(safeUser);
    return {token, user: safeUser};
}

export async function login({email, password}) {
    const user = await userRepository.findByEmail(email)
    const valid = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!user || !valid) {
        const err = new Error('Email ou mot de passe incorrect');
        err.status = 401;
        throw err;
    }

    if (!user.is_active) {
        const err = new Error('Utilisateur inactif');
        err.status = 403;
        throw err;
    }

    const safeUser = toSafeUser(user);
    const token = generateToken(safeUser);
    return {token, user: safeUser};
}

function toSafeUser(user) {
    return {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone ?? null,
        picture: user.picture ?? null,
        is_active: user.is_active,
    };
}

export async function getUserById(userId) {
    const user = await userRepository.findById(userId);
    if (!user || !user.is_active) {
        const err = new Error('Utilisateur introuvable ou inactif');
        err.status = 401;
        throw err;
    }
    return toSafeUser(user);
}