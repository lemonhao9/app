import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { planningQuerySchema, clientListQuerySchema, companyUpdateSchema, technicianCreateSchema, userUpdateSchema, adminUserUpdateSchema, userSchema, zoneSchema } from '../../src/utils/schemas.js';

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

describe('companyUpdateSchema', () => {
    const valid = {
        name: 'LeCycleLyonnais', legal_form: 'SARL', share_capital: 25000, rcs_city: 'Lyon',
        siret: '812 345 678 00019', address_line: '12 rue de la Part-Dieu', postal_code: '69003', city: 'Lyon',
        email: 'contact@homecyclhome.fr', publication_director: 'la gérance', host_name: 'OVH SAS', host_address: 'Roubaix',
    };

    it('accepte une fiche complète et retire les espaces du SIRET', () => {
        expect(companyUpdateSchema.parse(valid).siret).toBe('81234567800019');
    });

    it('refuse un SIRET qui n’a pas 14 chiffres', () => {
        expect(companyUpdateSchema.safeParse({ ...valid, siret: '812 345' }).success).toBe(false);
    });

    it('refuse un champ légal vide, un e-mail ou un code postal invalide', () => {
        expect(companyUpdateSchema.safeParse({ ...valid, publication_director: '   ' }).success).toBe(false);
        expect(companyUpdateSchema.safeParse({ ...valid, email: 'pas-un-mail' }).success).toBe(false);
        expect(companyUpdateSchema.safeParse({ ...valid, postal_code: '6900' }).success).toBe(false);
    });

    it('refuse un capital décimal, un champ manquant ou en trop', () => {
        expect(companyUpdateSchema.safeParse({ ...valid, share_capital: 1.5 }).success).toBe(false);
        const { city: _city, ...missing } = valid;
        expect(companyUpdateSchema.safeParse(missing).success).toBe(false);
        expect(companyUpdateSchema.safeParse({ ...valid, company_id: 2 }).success).toBe(false);
    });
});

describe('messages de validation', () => {
    it('sont en français (z.config(z.locales.fr()))', () => {
        const result = companyUpdateSchema.safeParse({});
        expect(result.success).toBe(false);
        expect(z.flattenError(result.error).fieldErrors.name[0]).toMatch(/Entrée invalide/);    });
});

describe('adresses e-mail (API zod 4)', () => {
    it('retire les espaces autour de l\'e-mail avant de le valider', () => {
        const result = technicianCreateSchema.parse({ email: '  tech@hch.fr ', name: 'Jean' });

        expect(result.email).toBe('tech@hch.fr');
    });

    it('retire aussi les espaces dans la mise à jour du profil et la fiche admin', () => {
        expect(userUpdateSchema.parse({ email: ' client@hch.fr ' }).email).toBe('client@hch.fr');
        expect(adminUserUpdateSchema.parse({ email: ' client@hch.fr ' }).email).toBe('client@hch.fr');
    });

    it('refuse une adresse invalide', () => {
        expect(userSchema.safeParse({ email: 'pas-un-mail', password: 'motdepasse', name: 'Léo' }).success).toBe(false);
        expect(technicianCreateSchema.safeParse({ email: 'tech@', name: 'Jean' }).success).toBe(false);
    });

    it('refuse une adresse de plus de 255 caractères dans la fiche admin', () => {
        const longEmail = `${'a'.repeat(250)}@hch.fr`;

        expect(adminUserUpdateSchema.safeParse({ email: longEmail }).success).toBe(false);
    });
});

describe('objets stricts et permissifs (API zod 4)', () => {
    it('refuse un champ inconnu dans la fiche admin d\'un utilisateur', () => {
        const result = adminUserUpdateSchema.safeParse({ name: 'Léo', role: 'admin' });

        expect(result.success).toBe(false);
        expect(result.error.issues[0].code).toBe('unrecognized_keys');
    });

    it('refuse toujours une fiche admin vide', () => {
        expect(adminUserUpdateSchema.safeParse({}).success).toBe(false);
    });

    it('conserve les propriétés supplémentaires du GeoJSON d\'une zone', () => {
        const geojson = {
            type: 'Feature',
            properties: { nom: 'Lyon 1er' },
            geometry: { type: 'Polygon', coordinates: [[[4.8, 45.7], [4.9, 45.7], [4.9, 45.8], [4.8, 45.7]]] },
        };

        const result = zoneSchema.parse({ name: 'Lyon 1er', geojson });

        expect(result.geojson.properties).toEqual({ nom: 'Lyon 1er' });
    });
});