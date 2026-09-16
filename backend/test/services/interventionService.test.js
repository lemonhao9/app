import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as interventionRepository from '../../src/repositories/interventionRepository.js';
import * as interventionService from '../../src/services/interventionService.js';
import * as socketUtil from '../../src/utils/socket.js';

vi.mock('../../src/repositories/interventionRepository.js');
vi.mock('../../src/utils/socket.js');

beforeEach(() => {
    vi.resetAllMocks();
});

describe('interventionService.cancelIntervention', () => {
    it("lève une 404 si l'intervention est introuvable", async () => {
        interventionRepository.findById.mockResolvedValue(null);

        await expect(interventionService.cancelIntervention(1, 'client', 99)).rejects.toMatchObject({ status: 404 });
    });

    it("lève une 404 si l'intervention n'appartient pas au client", async () => {
        interventionRepository.findById.mockResolvedValue({ intervention_id: 1, client_id: 2, technician_id: 9, state: 'prochainement' });

        await expect(interventionService.cancelIntervention(1, 'client', 1)).rejects.toMatchObject({ status: 404 });
    });

    it("lève une 409 si l'intervention n'est plus au statut 'prochainement' (client)", async () => {
        interventionRepository.findById.mockResolvedValue({ intervention_id: 1, client_id: 1, technician_id: 9, state: 'terminée' });

        await expect(interventionService.cancelIntervention(1, 'client', 1)).rejects.toMatchObject({ status: 409 });
    });

    it("annule l'intervention si elle appartient au client et est 'prochainement'", async () => {
        interventionRepository.findById.mockResolvedValue({ intervention_id: 1, client_id: 1, technician_id: 9, state: 'prochainement' });
        interventionRepository.cancel.mockResolvedValue({ intervention_id: 1, state: 'annulée' });

        const result = await interventionService.cancelIntervention(1, 'client', 1);

        expect(interventionRepository.cancel).toHaveBeenCalledWith(1);
        expect(result).toEqual({ intervention_id: 1, state: 'annulée' });
    });

    it("lève une 404 si l'intervention n'est pas assignée au technicien", async () => {
        interventionRepository.findById.mockResolvedValue({ intervention_id: 1, client_id: 1, technician_id: 9, state: 'prochainement' });

        await expect(interventionService.cancelIntervention(10, 'technician', 1)).rejects.toMatchObject({ status: 404 });
    });

    it("autorise le technicien à annuler une intervention 'en cours' (contrairement au client)", async () => {
        interventionRepository.findById.mockResolvedValue({ intervention_id: 1, client_id: 1, technician_id: 9, state: 'en cours' });
        interventionRepository.cancel.mockResolvedValue({ intervention_id: 1, state: 'annulée' });
        socketUtil.getIO.mockReturnValue(undefined);

        const result = await interventionService.cancelIntervention(9, 'technician', 1);

        expect(result).toEqual({ intervention_id: 1, state: 'annulée' });
    });

    it("lève une 409 si le technicien tente d'annuler une intervention déjà 'terminée'", async () => {
        interventionRepository.findById.mockResolvedValue({ intervention_id: 1, client_id: 1, technician_id: 9, state: 'terminée' });

        await expect(interventionService.cancelIntervention(9, 'technician', 1)).rejects.toMatchObject({ status: 409 });
    });

    it("notifie le client via Socket.io quand le technicien annule", async () => {
        interventionRepository.findById.mockResolvedValue({ intervention_id: 1, client_id: 1, technician_id: 9, state: 'prochainement' });
        interventionRepository.cancel.mockResolvedValue({ intervention_id: 1, state: 'annulée' });
        const emit = vi.fn();
        socketUtil.getIO.mockReturnValue({ to: vi.fn().mockReturnValue({ emit }) });

        await interventionService.cancelIntervention(9, 'technician', 1);

        expect(emit).toHaveBeenCalledWith('message:new', expect.objectContaining({ intervention_id: 1 }));
    });

    it("ne notifie pas Socket.io quand le client annule lui-même", async () => {
        interventionRepository.findById.mockResolvedValue({ intervention_id: 1, client_id: 1, technician_id: 9, state: 'prochainement' });
        interventionRepository.cancel.mockResolvedValue({ intervention_id: 1, state: 'annulée' });

        await interventionService.cancelIntervention(1, 'client', 1);

        expect(socketUtil.getIO).not.toHaveBeenCalled();
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

describe('interventionService.getTodayForTechnician', () => {
    it("retourne les interventions du jour renvoyées par le repository", async () => {
        const rows = [{ intervention_id: 1 }, { intervention_id: 2 }];
        interventionRepository.findByTechnicianToday.mockResolvedValue(rows);

        const result = await interventionService.getTodayForTechnician(9);

        expect(interventionRepository.findByTechnicianToday).toHaveBeenCalledWith(9);
        expect(result).toEqual(rows);
    });

    it("retourne un tableau vide si aucune intervention aujourd'hui", async () => {
        interventionRepository.findByTechnicianToday.mockResolvedValue([]);

        const result = await interventionService.getTodayForTechnician(9);

        expect(result).toEqual([]);
    });
});

describe('interventionService.getInterventionDetail', () => {
    it("lève une 404 si le technicien n'est pas assigné à l'intervention", async () => {
        interventionRepository.findById.mockResolvedValue({ client_id: 1, technician_id: 9 });

        await expect(interventionService.getInterventionDetail(10, 'technician', 42)).rejects.toMatchObject({ status: 404 });
        expect(interventionRepository.findDetailById).not.toHaveBeenCalled();
    });

        it("retourne le détail avec les produits additionnels et les photos si le technicien est assigné", async () => {
        interventionRepository.findById.mockResolvedValue({ client_id: 1, technician_id: 9 });
        interventionRepository.findDetailById.mockResolvedValue({ intervention_id: 42, bike_brand: 'Decathlon' });
        interventionRepository.findProductsByInterventionId.mockResolvedValue([{ product_id: 1, name: 'Antivol' }]);
        interventionRepository.findPhotosByInterventionId.mockResolvedValue([{ photo_id: 1, url: '/uploads/a.jpg' }]);

        const result = await interventionService.getInterventionDetail(9, 'technician', 42);

        expect(result).toEqual({ intervention_id: 42, bike_brand: 'Decathlon', products: [{ product_id: 1, name: 'Antivol' }], photos: [{ photo_id: 1, url: '/uploads/a.jpg' }] });
    });
});

describe('interventionService.startIntervention', () => {
    it("lève une 404 si l'intervention n'est pas assignée au technicien", async () => {
        interventionRepository.findById.mockResolvedValue({ technician_id: 9, state: 'prochainement' });

        await expect(interventionService.startIntervention(1, 42)).rejects.toMatchObject({ status: 404 });
    });

    it("lève une 409 si l'état n'est pas 'prochainement'", async () => {
        interventionRepository.findById.mockResolvedValue({ technician_id: 9, state: 'en cours' });

        await expect(interventionService.startIntervention(9, 42)).rejects.toMatchObject({ status: 409 });
    });

    it("démarre l'intervention si assignée et 'prochainement'", async () => {
        interventionRepository.findById.mockResolvedValue({ technician_id: 9, state: 'prochainement' });
        interventionRepository.updateState.mockResolvedValue({ intervention_id: 42, state: 'en cours' });

        const result = await interventionService.startIntervention(9, 42);

        expect(interventionRepository.updateState).toHaveBeenCalledWith(42, 'en cours');
        expect(result).toEqual({ intervention_id: 42, state: 'en cours' });
    });
});

describe('interventionService.completeIntervention', () => {
    it("lève une 404 si l'intervention n'est pas assignée au technicien", async () => {
        interventionRepository.findById.mockResolvedValue({ technician_id: 9, state: 'en cours' });

        await expect(interventionService.completeIntervention(1, 42, { total_price: 50, is_paid: true })).rejects.toMatchObject({ status: 404 });
    });

    it("lève une 409 si l'état n'est pas 'en cours'", async () => {
        interventionRepository.findById.mockResolvedValue({ technician_id: 9, state: 'prochainement' });

        await expect(interventionService.completeIntervention(9, 42, { total_price: 50, is_paid: true })).rejects.toMatchObject({ status: 409 });
    });

    it("clôture l'intervention si assignée et 'en cours'", async () => {
        interventionRepository.findById.mockResolvedValue({ technician_id: 9, state: 'en cours' });
        interventionRepository.complete.mockResolvedValue({ intervention_id: 42, state: 'terminée', total_price: '50.00', is_paid: true });

        const result = await interventionService.completeIntervention(9, 42, { total_price: 50, is_paid: true });

        expect(interventionRepository.complete).toHaveBeenCalledWith(42, { totalPrice: 50, isPaid: true });
        expect(result).toEqual({ intervention_id: 42, state: 'terminée', total_price: '50.00', is_paid: true });
    });
});

describe('interventionService.addPhotos', () => {
    it("lève une 404 si l'utilisateur n'a pas accès à l'intervention", async () => {
        interventionRepository.findById.mockResolvedValue({ client_id: 1, technician_id: 9 });

        await expect(interventionService.addPhotos(2, 'client', 42, [])).rejects.toMatchObject({ status: 404 });
        expect(interventionRepository.addPhoto).not.toHaveBeenCalled();
    });

    it("ajoute chaque fichier via interventionRepository.addPhoto pour le technicien assigné", async () => {
        interventionRepository.findById.mockResolvedValue({ client_id: 1, technician_id: 9 });
        interventionRepository.addPhoto
            .mockResolvedValueOnce({ photo_id: 1, url: '/uploads/a.jpg' })
            .mockResolvedValueOnce({ photo_id: 2, url: '/uploads/b.jpg' });

        const result = await interventionService.addPhotos(9, 'technician', 42, [{ filename: 'a.jpg' }, { filename: 'b.jpg' }]);

        expect(interventionRepository.addPhoto).toHaveBeenCalledTimes(2);
        expect(interventionRepository.addPhoto).toHaveBeenNthCalledWith(1, 42, '/uploads/a.jpg');
        expect(result).toEqual([{ photo_id: 1, url: '/uploads/a.jpg' }, { photo_id: 2, url: '/uploads/b.jpg' }]);
    });
});
