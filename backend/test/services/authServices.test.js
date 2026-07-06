import { describe, it, expect, vi, beforeEach, createExpect } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as userRepository from '../../src/repositories/userRepository.js';
import * as authServices from '../../src/services/authServices.js';


vi.mock('bcryptjs');
vi.mock('jsonwebtoken');
vi.mock('../../src/repositories/userRepository.js');

const baseUser = {
    user_id: 1,
    email: 'client@exemple.fr',
    name: 'Test Client',
    role: 'client',
    picture: null,
    is_active: true,
    password_hash: 'hashedPassword',
};

beforeEach(() => {
    vi.resetAllMocks();
    process.env.JWT_SECRET = 'test_secret';
    jwt.sign.mockReturnValue('fake_jwt_token');
});

describe('authServices.signup', () => {
    it('Mail déjà utilisé (409)', async () => {
        userRepository.findByEmail.mockResolvedValue(baseUser);

        await expect(authServices.signup({email: baseUser.email, password: 'password123', name: 'Test Client'})).rejects.toMatchObject({status: 409});
    });

    it('hashage du mdp + création du compte', async ()=> {
        userRepository.findByEmail.mockResolvedValue(null);
        bcrypt.hash.mockResolvedValue('hashedPassword');
        userRepository.create.mockResolvedValue(baseUser);

        const result = await authServices.signup ({
            email: baseUser.email,
            password: 'password123',
            name: baseUser.name,
        });

        expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
        expect(userRepository.create).toHaveBeenCalledWith({
            email: baseUser.email,
            passwordHash: 'hashedPassword',
            name: baseUser.name,
        });
        expect(result.token).toBe('fake_jwt_token');
        expect(result.user).not.toHaveProperty('passwordHash');
    });
});

describe('authServices.login', () => {
    it('utilisateur inconnu (401)', async () => {
        userRepository.findByEmail.mockResolvedValue(null);

        await expect(authServices.login({email: 'inconnu@exemple.com', password: 'x'})).rejects.toMatchObject({status: 401});
    });

    it ('mdp invalide (401)', async () => {
        userRepository.findByEmail.mockResolvedValue(baseUser);
        bcrypt.compare.mockResolvedValue(false);

        await expect(authServices.login({email: baseUser.email, password: 'mauvais'})).rejects.toMatchObject({status:401});
});

it('rejette compte inactif (403)', async () => {
    userRepository.findByEmail.mockResolvedValue({...baseUser, is_active: false});
    bcrypt.compare.mockResolvedValue(true);

    await expect(authServices.login({email: baseUser.email, password: 'password123'})).rejects.toMatchObject({status:403});
    
});

it('token send pour valides identifiants', async () => {
    userRepository.findByEmail.mockResolvedValue(baseUser);
    bcrypt.compare.mockResolvedValue(true);

    const result = await authServices.login({email: baseUser.email, password: 'password123'});
    
    expect(result.token).toBe('fake_jwt_token');
    expect(result.user.email).toBe(baseUser.email);
});
});