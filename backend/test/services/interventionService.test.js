import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as interventionRepository from '../../src/repositories/interventionRepository.js';
import * as interventionService from '../../src/services/interventionService.js';

vi.mock('../../src/repositories/interventionRepository.js');

beforeEach(() => {
    vi.resetAllMocks();
});

describe('interventionService.cancelIntervention', () => {
    it("lève une 404 si l'intervention est introuvable", async () => {
        interventionRepository.findById.mockResolvedValue(null);

        await expect(interventionService.cancelIntervention(1, 99)).rejects.toMatchObject({ status: 404 });
    });

    it("lève une 404 si l'intervention n'appartient pas au client", async () => {
        interventionRepository.findById.mockResolvedValue({ intervention_id: 1, client_id: 2, state: 'prochainement' });

        await expect(interventionService.cancelIntervention(1, 1)).rejects.toMatchObject({ status: 404 });
    });

    it("lève une 409 si l'intervention n'est plus au statut 'prochainement'", async () => {
        interventionRepository.findById.mockResolvedValue({ intervention_id: 1, client_id: 1, state: 'terminée' });

        await expect(interventionService.cancelIntervention(1, 1)).rejects.toMatchObject({ status: 409 });
    });

    it("annule l'intervention si elle appartient au client et est 'prochainement'", async () => {
        interventionRepository.findById.mockResolvedValue({ intervention_id: 1, client_id: 1, state: 'prochainement' });
        interventionRepository.cancel.mockResolvedValue({ intervention_id: 1, state: 'annulée' });

        const result = await interventionService.cancelIntervention(1, 1);

        expect(interventionRepository.cancel).toHaveBeenCalledWith(1);
        expect(result).toEqual({ intervention_id: 1, state: 'annulée' });
    });
});

describe('interventionService.getMyInterventions', () => {
    it("indique hasMore=false quand il n'y a pas de page suivante", async () => {
        interventionRepository.findByClientId.mockResolvedValue([{ intervention_id: 1 }, { intervention_id: 2 }]);

        const result = await interventionService.getMyInterventions(1, { sort: 'desc', limit: 6, offset: 0 });

        expect(result).toEqual({ interventions: [{ intervention_id: 1 }, { intervention_id: 2 }], hasMore: false });
    });

    it("indique hasMore=true et tronque la ligne en trop quand il y a une page suivante", async () => {
        const rows = Array.from({ length: 7 }, (_, i) => ({ intervention_id: i + 1 }));
        interventionRepository.findByClientId.mockResolvedValue(rows);

        const result = await interventionService.getMyInterventions(1, { sort: 'desc', limit: 6, offset: 0 });

        expect(result.interventions).toHaveLength(6);
        expect(result.hasMore).toBe(true);
    });
});

describe('interventionService.canAccessIntervention', () => {
    it('autorise toujours un admin, sans requête repository', async () => {
        const result = await interventionService.canAccessIntervention(1, 'admin', 42);

        expect(result).toBe(true);
        expect(interventionRepository.findById).not.toHaveBeenCalled();
    });

    it('refuse un id d\'intervention non numérique', async () => {
        const result = await interventionService.canAccessIntervention(1, 'client', 'oops');

        expect(result).toBe(false);
    });

    it("refuse si l'intervention est introuvable", async () => {
        interventionRepository.findById.mockResolvedValue(null);

        const result = await interventionService.canAccessIntervention(1, 'client', 42);

        expect(result).toBe(false);
    });

    it('autorise le client propriétaire de l\'intervention', async () => {
        interventionRepository.findById.mockResolvedValue({ client_id: 1, technician_id: 9 });

        expect(await interventionService.canAccessIntervention(1, 'client', 42)).toBe(true);
        expect(await interventionService.canAccessIntervention(2, 'client', 42)).toBe(false);
    });

    it('autorise le technicien assigné à l\'intervention', async () => {
        interventionRepository.findById.mockResolvedValue({ client_id: 1, technician_id: 9 });

        expect(await interventionService.canAccessIntervention(9, 'technician', 42)).toBe(true);
        expect(await interventionService.canAccessIntervention(10, 'technician', 42)).toBe(false);
    });
});
