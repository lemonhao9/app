import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as companyRepository from '../../src/repositories/companyRepository.js';
import * as companyService from '../../src/services/companyService.js';

vi.mock('../../src/repositories/companyRepository.js');

beforeEach(() => {
    vi.resetAllMocks();
});

describe('companyService.getCompany', () => {
    it('renvoie les informations de la société', async () => {
        companyRepository.find.mockResolvedValue({ name: 'LeCycleLyonnais', siret: '81234567800019' });

        const company = await companyService.getCompany();

        expect(company.name).toBe('LeCycleLyonnais');
    });

    it('lève une 404 si la ligne est absente', async () => {
        companyRepository.find.mockResolvedValue(null);

        await expect(companyService.getCompany()).rejects.toMatchObject({ status: 404 });
    });
});

describe('companyService.updateCompany', () => {
    it('renvoie la fiche mise à jour', async () => {
        companyRepository.update.mockResolvedValue({ name: 'Nouveau nom' });

        const company = await companyService.updateCompany({ name: 'Nouveau nom' });

        expect(companyRepository.update).toHaveBeenCalledWith({ name: 'Nouveau nom' });
        expect(company.name).toBe('Nouveau nom');
    });

    it('lève une 404 si la ligne est absente', async () => {
        companyRepository.update.mockResolvedValue(null);

        await expect(companyService.updateCompany({ name: 'X' })).rejects.toMatchObject({ status: 404 });
    });
});
