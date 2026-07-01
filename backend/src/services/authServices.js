import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as userRepository from '../repositories/userRepository.js'

const SALT_ROUNDS = 12;

function generateToken(user){
    return jwt.sign(
        {userId: user.user_id, role: user.role, email: user.email},
        process.env.JWT_SECRET,
        { expiresIn: '7d'}
    );
}
export async function signup({email, password, name}) {
    const existing = await userRepository.findByEmail(email)
    if (existing) {
        const err = new Error('Email déjà utilisé');
        err.status = 409;
        throw err;
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const created = await userRepository.create({email, passwordHash, name});
    const safeUser = {
        user_id: created.user_id,
        email: created.email,
        name: created.name,
        role: created.role,
        picture: created.picture ?? null,
        is_active: created.is_active,
    };
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

    const safeUser = {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
        picture: user.picture ?? null,
        is_active: user.is_active,
    };
    const token = generateToken(safeUser);
    return {token, user: safeUser};
}
