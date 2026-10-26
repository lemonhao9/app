import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as addressService from '../../src/services/addressService.js';
import * as addressRepository from '../../src/repositories/addressRepository.js';
import * as zoneService from '../../src/services/zoneService.js';

vi.mock('../../src/repositories/addressRepository.js');
vi.mock('../../src/services/zoneService.js');

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

describe('addressService.createAddress', () => {
    const label = '10 Rue de la République, Lyon';

    beforeEach(() => {
        addressRepository.findByUserId.mockReset().mockResolvedValue([]);
        addressRepository.create.mockReset().mockImplementation(async (data) => ({ address_id: 1, ...data }));
        zoneService.findZoneForPoint.mockReset().mockResolvedValue(3);
    });

    it("enregistre l'adresse avec les coordonnées de la BAN et la zone déduite", async () => {
        await addressService.createAddress(7, label);

        expect(zoneService.findZoneForPoint).toHaveBeenCalledWith(45.7640, 4.8357);
        expect(addressRepository.create).toHaveBeenCalledWith(expect.objectContaining({
            addressName: label, postalCode: '69001', latitude: 45.7640, longitude: 4.8357,
            zoneId: 3, isDefault: false, userId: 7,
        }));
    });

    it('accepte une adresse hors zone (zone_id null)', async () => {
        zoneService.findZoneForPoint.mockResolvedValue(null);

        await addressService.createAddress(7, label);

        expect(addressRepository.create).toHaveBeenCalledWith(expect.objectContaining({ zoneId: null }));
    });

    it("lève une 422 si le libellé ne correspond exactement à aucun résultat de la BAN", async () => {
        await expect(addressService.createAddress(7, '10 Rue de la Republique')).rejects.toMatchObject({ status: 422 });
        expect(addressRepository.create).not.toHaveBeenCalled();
    });

    it('lève une 502 si la BAN est injoignable', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('timeout'));

        await expect(addressService.createAddress(7, label)).rejects.toMatchObject({ status: 502 });
    });

    it("lève une 409 sans appeler la BAN si l'adresse est déjà enregistrée", async () => {
        addressRepository.findByUserId.mockResolvedValue([{ address_name: label }]);

        await expect(addressService.createAddress(7, label)).rejects.toMatchObject({ status: 409 });
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it("lève une 409 sans appeler la BAN au-delà de 10 adresses", async () => {
        addressRepository.findByUserId.mockResolvedValue(Array.from({ length: 10 }, (_, i) => ({ address_name: `a${i}` })));

        await expect(addressService.createAddress(7, label)).rejects.toMatchObject({ status: 409 });
        expect(global.fetch).not.toHaveBeenCalled();
    });
});
