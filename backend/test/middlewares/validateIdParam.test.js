import { describe, it, expect, vi } from 'vitest';
import { validateIdParam } from '../../src/middlewares/validateIdParam.js';

function makeRes() {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
}

describe('validateIdParam', () => {
    it.each(['1', '42', '2147483647'])('laisse passer l\'identifiant %s', (value) => {
        const res = makeRes();
        const next = vi.fn();

        validateIdParam({}, res, next, value);

        expect(next).toHaveBeenCalledWith();
        expect(res.status).not.toHaveBeenCalled();
    });

    it.each(['0', '-1', 'abc', '1.5', '1e3', ' 1', '2147483648', ''])('refuse (400) l\'identifiant « %s »', (value) => {
        const res = makeRes();
        const next = vi.fn();

        validateIdParam({}, res, next, value);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Identifiant invalide' });
        expect(next).not.toHaveBeenCalled();
    });
});