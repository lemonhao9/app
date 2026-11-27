import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { sendValidationError } from '../../src/utils/validation.js';

function makeRes() {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
}

describe('sendValidationError', () => {
    it('répond 400 avec les erreurs regroupées par champ', () => {
        const { error } = z.object({ name: z.string(), age: z.number() }).safeParse({ age: 'x' });
        const res = makeRes();

        sendValidationError(res, error);

        expect(res.status).toHaveBeenCalledWith(400);
        const body = res.json.mock.calls[0][0];
        expect(body.error.formErrors).toEqual([]);
        expect(Object.keys(body.error.fieldErrors).sort()).toEqual(['age', 'name']);
    });

    it('place les erreurs globales (refine sans champ) dans formErrors', () => {
        const { error } = z.object({ a: z.number() }).refine(() => false, { message: 'Aucune donnée' }).safeParse({ a: 1 });
        const res = makeRes();

        sendValidationError(res, error);

        expect(res.json.mock.calls[0][0].error.formErrors).toEqual(['Aucune donnée']);
    });
});