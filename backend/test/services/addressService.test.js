import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as addressService from '../../src/services/addressService.js';

const banResponse = {
    features: [
        {
            properties: {label: '10 Rue de la République, Lyon', city: 'Lyon', postcode: '69001' },
            geometry: {coordinates: [4.8357, 45.7640]},
        },
        {
            properties: {label: '1 Rue Test, Villeurbanne', city: 'Villeurbanne', postcode: '75000' },
            geometry: {coordinates: [4.8905, 45.7700]},
        },
    ],
};

beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => banResponse,
    });
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('addressService.geocode', () => {
    it ('Lyon ajouter à la requete si abs', async () => {
        await addressService.geocode('Rue de la République');
    
        const calledUrl = decodeURIComponent(global.fetch.mock.calls[0][0]);
        expect(calledUrl).toContain('Rue de la République Lyon');
    });

    it("n'ajoute pas Lyon si déjà présent dans requête", async () => {
        await addressService.geocode('Rue de Lyon');

        const calledUrl = decodeURIComponent(global.fetch.mock.calls[0][0]);
        expect(calledUrl).toContain('Rue de Lyon');
        expect(calledUrl).not.toContain('Rue de Lyon Lyon');
    });

    it('filtre résultats hors du 69', async () => {
        const results = await addressService.geocode('Rue de la République');

        expect(results).toHaveLength(1);
        expect(results[0].postcode).toBe('69001');
    });

    it('mappage des résultats attendus', async () => {
        const results = await addressService.geocode('Rue de la République');

        expect(results[0]).toEqual({
            label: '10 Rue de la République, Lyon',
            city: 'Lyon',
            postcode: '69001',
            longitude: 4.8357,
            latitude: 45.7640,
        });
    });

    it('lève une erreur si la requête ban échoue', async () => {
        global.fetch = vi.fn().mockResolvedValue({ok: false});

        await expect(addressService.geocode('Rue Test')).rejects.toThrow('Erreur: BAN API request failed');
    });
    });