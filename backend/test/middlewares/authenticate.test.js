import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import * as userRepository from '../../src/repositories/userRepository.js';
import { authenticate, authenticateAllowingPasswordChange, isTokenRevoked } from '../../src/middlewares/authenticate.js';

vi.mock('jsonwebtoken');
vi.mock('../../src/repositories/userRepository.js');

const activeUser = {
    user_id: 1, role: 'technician', email: 'tech@hch.fr',
    is_active: true, must_change_password: false, password_changed_epoch: null,
};

function makeReq() {
    return { headers: { authorization: 'Bearer jeton' } };
}

function makeRes() {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
}

beforeEach(() => {
    vi.clearAllMocks();
    jwt.verify.mockReturnValue({ userId: 1, iat: 1000 });
});

describe('isTokenRevoked', () => {
    it("ne révoque rien si le mot de passe n'a jamais été changé", () => {
        expect(isTokenRevoked({ password_changed_epoch: null }, { iat: 1000 })).toBe(false);
    });

    it('révoque un jeton émis avant le changement', () => {
        expect(isTokenRevoked({ password_changed_epoch: '1001' }, { iat: 1000 })).toBe(true);
    });

    it('accepte un jeton émis dans la seconde du changement', () => {
        expect(isTokenRevoked({ password_changed_epoch: '1000' }, { iat: 1000 })).toBe(false);
    });

    it('révoque un jeton sans iat si le mot de passe a été changé', () => {
        expect(isTokenRevoked({ password_changed_epoch: '1000' }, {})).toBe(true);
    });
});

describe('authenticate', () => {
    it('laisse passer un jeton valide', async () => {
        userRepository.findById.mockResolvedValue(activeUser);
        const req = makeReq();
        const res = makeRes();
        const next = vi.fn();

        await authenticate(req, res, next);

        expect(next).toHaveBeenCalledWith();
        expect(req.user).toEqual({ userId: 1, role: 'technician', email: 'tech@hch.fr' });
    });

    it('refuse (401) un jeton antérieur au changement de mot de passe', async () => {
        userRepository.findById.mockResolvedValue({ ...activeUser, password_changed_epoch: '2000' });
        const res = makeRes();
        const next = vi.fn();

        await authenticate(makeReq(), res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('refuse (403 PASSWORD_CHANGE_REQUIRED) tant que le provisoire est actif', async () => {
        userRepository.findById.mockResolvedValue({ ...activeUser, must_change_password: true });
        const res = makeRes();
        const next = vi.fn();

        await authenticate(makeReq(), res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'PASSWORD_CHANGE_REQUIRED' }));
        expect(next).not.toHaveBeenCalled();
    });

    it('authenticateAllowingPasswordChange laisse passer un compte à mot de passe provisoire', async () => {
        userRepository.findById.mockResolvedValue({ ...activeUser, must_change_password: true });
        const res = makeRes();
        const next = vi.fn();

        await authenticateAllowingPasswordChange(makeReq(), res, next);

        expect(next).toHaveBeenCalledWith();
    });
});
