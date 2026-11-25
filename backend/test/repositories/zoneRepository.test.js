import { describe, it, expect, vi, beforeEach } from 'vitest';
import pool, { query } from '../../src/utils/db.js';
import * as zoneRepository from '../../src/repositories/zoneRepository.js';

// Mock explicite (pas d'automock) : pool est une instance pg.Pool dont les
// méthodes vivent sur le prototype (non énumérables), l'automock de Vitest
// ne les remplacerait pas de façon fiable.
vi.mock('../../src/utils/db.js', () => ({
    default: { query: vi.fn() },
    query: vi.fn(),
}));

beforeEach(() => {
    vi.resetAllMocks();
});

describe('zoneRepository.findZoneForPoint', () => {
    it("interroge ST_Contains avec les coordonnées dans l'ordre [longitude, latitude]", async () => {
        query.mockResolvedValue({ rows: [{ zone_id: 3 }] });

        const zoneId = await zoneRepository.findZoneForPoint(45.7640, 4.8357);

        expect(query).toHaveBeenCalledWith(expect.stringContaining('ST_Contains'), [4.8357, 45.7640]);
        expect(zoneId).toBe(3);
    });

    it('renvoie null si aucune zone active ne contient le point', async () => {
        query.mockResolvedValue({ rows: [] });

        const zoneId = await zoneRepository.findZoneForPoint(0, 0);

        expect(zoneId).toBeNull();
    });
});

describe('zoneRepository.countReferences', () => {
        it('compte les adresses et interventions référençant la zone', async () => {
        query.mockResolvedValue({ rows: [{ address_count: '2', intervention_count: '0' }] });

        const result = await zoneRepository.countReferences(1);

        expect(query).toHaveBeenCalledWith(expect.stringContaining('FROM intervention'), [1]);
        expect(result).toEqual({ addressCount: 2, interventionCount: 0 });
    });
});

describe('zoneRepository.isTechnicianInActiveZone', () => {
    it('vérifie le rattachement sur une zone active avec [zoneId, userId]', async () => {
        query.mockResolvedValue({ rows: [{ '?column?': 1 }] });

        const result = await zoneRepository.isTechnicianInActiveZone(2, 7);

        expect(query).toHaveBeenCalledWith(expect.stringContaining('z.is_active = TRUE'), [2, 7]);
        expect(result).toBe(true);
    });

    it("renvoie false si le technicien ne couvre pas la zone (ou qu'elle est inactive)", async () => {
        query.mockResolvedValue({ rows: [] });

        expect(await zoneRepository.isTechnicianInActiveZone(2, 7)).toBe(false);
    });
});

describe('zoneRepository.technicianHasActiveZone', () => {
    it('renvoie true si le technicien est positionné sur au moins une zone active', async () => {
        query.mockResolvedValue({ rows: [{ '?column?': 1 }] });

        const result = await zoneRepository.technicianHasActiveZone(7);

        expect(query).toHaveBeenCalledWith(expect.stringContaining('z.is_active = TRUE'), [7]);
        expect(result).toBe(true);
    });

    it("renvoie false s'il n'est positionné sur aucune zone active", async () => {
        query.mockResolvedValue({ rows: [] });

        expect(await zoneRepository.technicianHasActiveZone(7)).toBe(false);
    });
});

describe('zoneRepository.remove', () => {
    it('supprime la zone et renvoie son id', async () => {
        pool.query.mockResolvedValue({ rows: [{ zone_id: 1 }] });

        const result = await zoneRepository.remove(1);

        expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM zone'), [1]);
        expect(result).toEqual({ zone_id: 1 });
    });

    it('renvoie null si la zone est introuvable', async () => {
        pool.query.mockResolvedValue({ rows: [] });

        const result = await zoneRepository.remove(999);

        expect(result).toBeNull();
    });
});

describe('zoneRepository.assignTechnician / unassignTechnician', () => {
    it('insère la ligne positionner avec ON CONFLICT DO NOTHING', async () => {
        pool.query.mockResolvedValue({});

        await zoneRepository.assignTechnician(1, 2);

        expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT DO NOTHING'), [1, 2]);
    });

    it('supprime la ligne positionner correspondante', async () => {
        pool.query.mockResolvedValue({});

        await zoneRepository.unassignTechnician(1, 2);

        expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM positionner'), [1, 2]);
    });
});
