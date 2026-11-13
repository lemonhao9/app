import { describe, it, expect } from 'vitest';
import { planningQuerySchema, clientListQuerySchema } from '../../src/utils/schemas.js';

describe('planningQuerySchema', () => {
    it('accepte une semaine', () => {
        expect(planningQuerySchema.safeParse({ start: '2026-11-09', end: '2026-11-16' }).success).toBe(true);
    });

    it('accepte la vue mois (42 jours)', () => {
        expect(planningQuerySchema.safeParse({ start: '2026-10-26', end: '2026-12-07' }).success).toBe(true);
    });

    it('refuse une fin antérieure ou égale au début', () => {
        expect(planningQuerySchema.safeParse({ start: '2026-11-16', end: '2026-11-09' }).success).toBe(false);
        expect(planningQuerySchema.safeParse({ start: '2026-11-09', end: '2026-11-09' }).success).toBe(false);
    });

    it('refuse une période de plus de 42 jours', () => {
        expect(planningQuerySchema.safeParse({ start: '2026-01-01', end: '2026-03-01' }).success).toBe(false);
    });

    it('refuse une date impossible', () => {
        expect(planningQuerySchema.safeParse({ start: '2026-13-01', end: '2026-13-08' }).success).toBe(false);
    });
});

describe('clientListQuerySchema', () => {
    it('applique la pagination par défaut', () => {
        expect(clientListQuerySchema.parse({})).toEqual({ limit: 20, offset: 0 });
    });

    it('transforme une zone unique en tableau', () => {
        expect(clientListQuerySchema.parse({ zone_id: '26' }).zone_id).toEqual([26]);
    });

    it('accepte plusieurs zones', () => {
        expect(clientListQuerySchema.parse({ zone_id: ['26', '30'] }).zone_id).toEqual([26, 30]);
    });

    it('refuse une zone non numérique, un état inconnu ou un paramètre en trop', () => {
        expect(clientListQuerySchema.safeParse({ zone_id: 'abc' }).success).toBe(false);
        expect(clientListQuerySchema.safeParse({ status: 'banni' }).success).toBe(false);
        expect(clientListQuerySchema.safeParse({ role: 'admin' }).success).toBe(false);
    });
});
