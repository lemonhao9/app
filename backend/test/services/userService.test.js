import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import * as userRepository from '../../src/repositories/userRepository.js';
import * as bikeRepository from '../../src/repositories/bikeRepository.js';
import * as interventionRepository from '../../src/repositories/interventionRepository.js';
import * as db from '../../src/utils/db.js';
import * as fileStorage from '../../src/utils/fileStorage.js';
import * as userService from '../../src/services/userService.js';

vi.mock('../../src/repositories/userRepository.js');
vi.mock('../../src/repositories/bikeRepository.js');
vi.mock('../../src/repositories/interventionRepository.js');
vi.mock('../../src/utils/db.js');
vi.mock('../../src/utils/fileStorage.js');
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


describe('userService.deleteAccount', () => {
    it("lève une 404 si l'utilisateur n'existe pas", async () => {
        userRepository.findById.mockResolvedValue(null);

        await expect(userService.deleteAccount(1)).rejects.toMatchObject({ status: 404 });
        expect(db.getClient).not.toHaveBeenCalled();
    });

    it('annule les interventions, efface les données et supprime les fichiers dans une transaction', async () => {
        const client = { query: vi.fn(), release: vi.fn() };
        db.getClient.mockResolvedValue(client);
        userRepository.findById.mockResolvedValue({ ...currentUser, picture: '/uploads/moi.jpg' });
        bikeRepository.findByUserId.mockResolvedValue([{ bike_id: 3, photo: '/uploads/velo.jpg' }, { bike_id: 4, photo: null }]);
        interventionRepository.removePhotosByClientId.mockResolvedValue(['/uploads/inter.jpg']);

        await userService.deleteAccount(1);

        expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
        expect(interventionRepository.cancelActiveByClientId).toHaveBeenCalledWith(1, client);
        expect(interventionRepository.removePhotosByClientId).toHaveBeenCalledWith(1, client);
        expect(bikeRepository.removeUnreferencedByUserId).toHaveBeenCalledWith(1, client);
        expect(bikeRepository.clearPhotosByUserId).toHaveBeenCalledWith(1, client);
        expect(userRepository.anonymize).toHaveBeenCalledWith(1, client);
        expect(userRepository.deleteAddresses).toHaveBeenCalledWith(1, client);
        expect(client.query).toHaveBeenLastCalledWith('COMMIT');
        expect(client.release).toHaveBeenCalled();
        expect(fileStorage.deletePhotoFile.mock.calls.map(call => call[0]).sort())
            .toEqual(['/uploads/inter.jpg', '/uploads/moi.jpg', '/uploads/velo.jpg']);
    });

    it('annule la transaction et ne supprime aucun fichier si une étape échoue', async () => {
        const client = { query: vi.fn(), release: vi.fn() };
        db.getClient.mockResolvedValue(client);
        bikeRepository.findByUserId.mockResolvedValue([{ bike_id: 3, photo: '/uploads/velo.jpg' }]);
        userRepository.anonymize.mockRejectedValue(new Error('boom'));

        await expect(userService.deleteAccount(1)).rejects.toThrow('boom');

        expect(client.query).toHaveBeenLastCalledWith('ROLLBACK');
        expect(client.release).toHaveBeenCalled();
        expect(fileStorage.deletePhotoFile).not.toHaveBeenCalled();
    });
});
