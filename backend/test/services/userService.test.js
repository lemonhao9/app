import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import * as userRepository from '../../src/repositories/userRepository.js';
import * as userService from '../../src/services/userService.js';

vi.mock('../../src/repositories/userRepository.js');
vi.mock('bcryptjs');

const currentUser = {
    user_id: 1,
    email: 'tech@homecycl.fr',
    name: 'Jean',
    phone: '0600000000',
    picture: null,
    password_hash: 'hashed-old',
    role: 'technician',
    is_active: true,
};

beforeEach(() => {
    vi.resetAllMocks();
    userRepository.findById.mockResolvedValue({ ...currentUser });
    userRepository.update.mockImplementation((id, data) => Promise.resolve({ user_id: id, ...data }));
});

describe('userService.updateProfile', () => {
    it('lève une 409 si le nouvel email est déjà pris par un autre utilisateur', async () => {
        userRepository.findByEmail.mockResolvedValue({ user_id: 2, email: 'autre@homecycl.fr' });

        await expect(userService.updateProfile(1, { email: 'autre@homecycl.fr' })).rejects.toMatchObject({ status: 409 });
    });

    it("n'appelle pas findByEmail si l'email n'a pas changé", async () => {
        await userService.updateProfile(1, { email: currentUser.email });

        expect(userRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('lève une 401 si le mot de passe actuel est incorrect', async () => {
        bcrypt.compare.mockResolvedValue(false);

        await expect(userService.updateProfile(1, { newPassword: 'nouveauMdp123', currentPassword: 'faux' }))
            .rejects.toMatchObject({ status: 401 });
    });

    it('change le mot de passe si l\'ancien est correct', async () => {
        bcrypt.compare.mockResolvedValue(true);
        bcrypt.hash.mockResolvedValue('hashed-new');

        await userService.updateProfile(1, { newPassword: 'nouveauMdp123', currentPassword: 'ancien' });

        expect(bcrypt.hash).toHaveBeenCalledWith('nouveauMdp123', 12);
        expect(userRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({ passwordHash: 'hashed-new' }));
    });

    it('met à jour name/phone sans toucher au mot de passe ni à l\'email si non fournis', async () => {
        await userService.updateProfile(1, { name: 'Nouveau nom' });

        expect(userRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({
            name: 'Nouveau nom',
            phone: currentUser.phone,
            email: currentUser.email,
            passwordHash: currentUser.password_hash,
        }));
    });
});
