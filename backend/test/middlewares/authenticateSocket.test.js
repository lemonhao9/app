import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import * as userRepository from '../../src/repositories/userRepository.js';
import { authenticateSocket } from '../../src/middlewares/authenticateSocket.js';

vi.mock('jsonwebtoken');
vi.mock('../../src/repositories/userRepository.js');

const activeUser = {
    user_id: 1, role: 'client', email: 'client@hch.fr',
    is_active: true, must_change_password: false, password_changed_epoch: null,
};

function makeSocket(token = 'jeton') {
    return { handshake: { auth: token === null ? {} : { token } }, data: {} };
}

function errorMessageOf(next) {
    return next.mock.calls[0][0]?.message;
}

beforeEach(() => {
    vi.resetAllMocks();
    jwt.verify.mockReturnValue({ userId: 1, iat: 1000 });
    userRepository.findById.mockResolvedValue(activeUser);
});

describe('authenticateSocket', () => {
    it('accepte un jeton valide et renseigne socket.data', async () => {
        const socket = makeSocket();
        const next = vi.fn();

        await authenticateSocket(socket, next);

        expect(next).toHaveBeenCalledWith();
        expect(socket.data).toEqual({ userId: 1, role: 'client' });
    });

    it('refuse une connexion sans jeton', async () => {
        const next = vi.fn();

        await authenticateSocket(makeSocket(null), next);

        expect(errorMessageOf(next)).toBe('Token Socket.io manquant');
        expect(jwt.verify).not.toHaveBeenCalled();
    });

    it('refuse un jeton invalide ou expiré', async () => {
        jwt.verify.mockImplementation(() => { throw new Error('jwt expired'); });
        const next = vi.fn();

        await authenticateSocket(makeSocket(), next);

        expect(errorMessageOf(next)).toBe('Token Socket.io invalide ou expiré');
        expect(userRepository.findById).not.toHaveBeenCalled();
    });

    it('refuse un compte introuvable ou désactivé', async () => {
        userRepository.findById.mockResolvedValue({ ...activeUser, is_active: false });
        const next = vi.fn();

        await authenticateSocket(makeSocket(), next);

        expect(errorMessageOf(next)).toBe('Compte introuvable ou désactivé');
    });

    it('refuse un jeton émis avant le dernier changement de mot de passe', async () => {
        userRepository.findById.mockResolvedValue({ ...activeUser, password_changed_epoch: '2000' });
        const next = vi.fn();

        await authenticateSocket(makeSocket(), next);

        expect(errorMessageOf(next)).toBe('Session expirée : veuillez vous reconnecter');
    });

    it('refuse un compte dont le mot de passe provisoire doit être remplacé', async () => {
        userRepository.findById.mockResolvedValue({ ...activeUser, must_change_password: true });
        const socket = makeSocket();
        const next = vi.fn();

        await authenticateSocket(socket, next);

        expect(errorMessageOf(next)).toBe('Changement du mot de passe provisoire requis');
        expect(socket.data).toEqual({});
    });

    it("renvoie une erreur générique si la base ne répond pas, sans détail interne", async () => {
        userRepository.findById.mockRejectedValue(new Error('ECONNREFUSED 10.0.0.5:5432'));
        const next = vi.fn();

        await authenticateSocket(makeSocket(), next);

        expect(errorMessageOf(next)).toBe('Une erreur est survenue');
    });
});