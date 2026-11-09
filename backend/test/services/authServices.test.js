import { describe, it, expect, vi, beforeEach, createExpect } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as userRepository from '../../src/repositories/userRepository.js';
import * as authServices from '../../src/services/authServices.js';
import * as addressRepository from '../../src/repositories/addressRepository.js';
import * as zoneService from '../../src/services/zoneService.js';
import * as db from '../../src/utils/db.js';

vi.mock('bcryptjs');
vi.mock('jsonwebtoken');
vi.mock('../../src/repositories/userRepository.js');
vi.mock('../../src/repositories/addressRepository.js');
vi.mock('../../src/services/zoneService.js');
vi.mock('../../src/utils/db.js');

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
        const fakeClient = { query: vi.fn().mockResolvedValue({}), release: vi.fn() };
        db.getClient.mockResolvedValue(fakeClient);
        userRepository.findByEmail.mockResolvedValue(null);
        bcrypt.hash.mockResolvedValue('hashedPassword');
        userRepository.create.mockResolvedValue(baseUser);
        addressRepository.create.mockResolvedValue({});
        zoneService.findZoneForPoint.mockResolvedValue(3);

        const result = await authServices.signup ({
            email: baseUser.email,
            password: 'password123',
            name: baseUser.name,
            address: { label: '10 rue de la Republique', city: 'Lyon', postal_code: '69000', longitude: '4.83', latitude: '45.76' }
        });

        expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
        expect(zoneService.findZoneForPoint).toHaveBeenCalledWith('45.76', '4.83');
        expect(userRepository.create).toHaveBeenCalledWith({
            email: baseUser.email,
            passwordHash: 'hashedPassword',
            name: baseUser.name,
            phone: null
        }, fakeClient);
        expect(addressRepository.create).toHaveBeenCalledWith(
            expect.objectContaining({ zoneId: 3 }),
            fakeClient
        );
        expect(result.token).toBe('fake_jwt_token');
        expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('convertit une violation 23505 (race condition) en 409 propre', async () => {
        const fakeClient = { query: vi.fn().mockResolvedValue({}), release: vi.fn() };
        db.getClient.mockResolvedValue(fakeClient);
        userRepository.findByEmail.mockResolvedValue(null);
        bcrypt.hash.mockResolvedValue('hashedPassword');
        zoneService.findZoneForPoint.mockResolvedValue(3);
        const dbError = new Error('duplicate key value violates unique constraint');
        dbError.code = '23505';
        userRepository.create.mockRejectedValue(dbError);

        await expect(authServices.signup({
            email: baseUser.email,
            password: 'password123',
            name: baseUser.name,
            address: { label: '10 rue de la Republique', city: 'Lyon', postal_code: '69000', longitude: '4.83', latitude: '45.76' }
        })).rejects.toMatchObject({ status: 409 });

        expect(fakeClient.query).toHaveBeenCalledWith('ROLLBACK');
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

describe('authServices — mot de passe provisoire', () => {
    const tempUser = { ...baseUser, role: 'technician', must_change_password: true, temp_password_expired: false };

    it('refuse la connexion (403 TEMP_PASSWORD_EXPIRED) si le mot de passe provisoire a expiré', async () => {
        userRepository.findByEmail.mockResolvedValue({ ...tempUser, temp_password_expired: true });
        bcrypt.compare.mockResolvedValue(true);

        await expect(authServices.login({ email: baseUser.email, password: 'Provisoire12' }))
            .rejects.toMatchObject({ status: 403, appCode: 'TEMP_PASSWORD_EXPIRED' });
    });

    it('signale must_change_password à la connexion tant que le provisoire est valide', async () => {
        userRepository.findByEmail.mockResolvedValue(tempUser);
        bcrypt.compare.mockResolvedValue(true);

        const result = await authServices.login({ email: baseUser.email, password: 'Provisoire12' });

        expect(result.user.must_change_password).toBe(true);
    });

    it('refuse le changement si le mot de passe actuel est faux (400)', async () => {
        userRepository.findById.mockResolvedValue(tempUser);
        bcrypt.compare.mockResolvedValue(false);

        await expect(authServices.changePassword(1, { currentPassword: 'faux', newPassword: 'NouveauMdp1' }))
            .rejects.toMatchObject({ status: 400 });
        expect(userRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('refuse un nouveau mot de passe identique au provisoire (400)', async () => {
        userRepository.findById.mockResolvedValue(tempUser);
        bcrypt.compare.mockResolvedValue(true);

        await expect(authServices.changePassword(1, { currentPassword: 'Provisoire12', newPassword: 'Provisoire12' }))
            .rejects.toMatchObject({ status: 400 });
    });

    it('refuse le changement si le provisoire a expiré (403)', async () => {
        userRepository.findById.mockResolvedValue({ ...tempUser, temp_password_expired: true });

        await expect(authServices.changePassword(1, { currentPassword: 'Provisoire12', newPassword: 'NouveauMdp1' }))
            .rejects.toMatchObject({ status: 403 });
        expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('enregistre le nouveau hash et lève le drapeau', async () => {
        userRepository.findById.mockResolvedValue(tempUser);
        bcrypt.compare.mockResolvedValue(true);
        bcrypt.hash.mockResolvedValue('nouveau-hash');
        userRepository.updatePassword.mockResolvedValue({ ...baseUser, role: 'technician', must_change_password: false });

        const result = await authServices.changePassword(1, { currentPassword: 'Provisoire12', newPassword: 'NouveauMdp1' });

        expect(userRepository.updatePassword).toHaveBeenCalledWith(1, 'nouveau-hash');
        expect(result.user.must_change_password).toBe(false);
        expect(result.token).toBe('fake_jwt_token');

    });
});
