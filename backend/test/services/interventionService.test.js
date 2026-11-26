import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as interventionRepository from '../../src/repositories/interventionRepository.js';
import * as interventionService from '../../src/services/interventionService.js';
import * as socketUtil from '../../src/utils/socket.js';
import * as slotRepository from '../../src/repositories/slotRepository.js';
import * as addressRepository from '../../src/repositories/addressRepository.js';
import * as bikeRepository from '../../src/repositories/bikeRepository.js';
import * as zoneRepository from '../../src/repositories/zoneRepository.js';
import * as feesRepository from '../../src/repositories/feesRepository.js';
import * as productsRepository from '../../src/repositories/productsRepository.js';
import * as db from '../../src/utils/db.js';

vi.mock('../../src/repositories/interventionRepository.js');
vi.mock('../../src/repositories/slotRepository.js');
vi.mock('../../src/repositories/addressRepository.js');
vi.mock('../../src/repositories/bikeRepository.js');
vi.mock('../../src/repositories/zoneRepository.js');
vi.mock('../../src/repositories/feesRepository.js');
vi.mock('../../src/repositories/productsRepository.js');
vi.mock('../../src/utils/socket.js');
vi.mock('../../src/utils/db.js');

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

        expect(interventionRepository.cancel).toHaveBeenCalledWith(1, ['prochainement']);
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

    it("autorise l'admin à annuler une intervention 'en cours' sans vérification de propriété", async () => {
        interventionRepository.findById.mockResolvedValue({ intervention_id: 1, client_id: 1, technician_id: 9, state: 'en cours' });
        interventionRepository.cancel.mockResolvedValue({ intervention_id: 1, state: 'annulée' });
        socketUtil.getIO.mockReturnValue(undefined);

        const result = await interventionService.cancelIntervention(99, 'admin', 1);

        expect(result).toEqual({ intervention_id: 1, state: 'annulée' });
    });

    it("lève une 409 si l'admin tente d'annuler une intervention déjà 'terminée'", async () => {
        interventionRepository.findById.mockResolvedValue({ intervention_id: 1, client_id: 1, technician_id: 9, state: 'terminée' });

        await expect(interventionService.cancelIntervention(99, 'admin', 1)).rejects.toMatchObject({ status: 409 });
    });

    it("notifie le client via Socket.io avec un message distinct quand l'admin annule", async () => {
        interventionRepository.findById.mockResolvedValue({ intervention_id: 1, client_id: 1, technician_id: 9, state: 'prochainement' });
        interventionRepository.cancel.mockResolvedValue({ intervention_id: 1, state: 'annulée' });
        const emit = vi.fn();
        socketUtil.getIO.mockReturnValue({ to: vi.fn().mockReturnValue({ emit }) });

        await interventionService.cancelIntervention(99, 'admin', 1);

        expect(emit).toHaveBeenCalledWith('message:new', expect.objectContaining({
            content: "Cette intervention a été annulée par l'administration.",
        }));
    });

});

describe('interventionService.reassignIntervention', () => {
    it("lève une 404 si l'intervention est introuvable", async () => {
        interventionRepository.findById.mockResolvedValue(null);

        await expect(interventionService.reassignIntervention(1, { slot_id: 5 })).rejects.toMatchObject({ status: 404 });
    });

    it("lève une 409 si l'intervention n'est plus 'prochainement' ou 'en cours'", async () => {
        interventionRepository.findById.mockResolvedValue({ intervention_id: 1, address_id: 3, state: 'terminée' });

        await expect(interventionService.reassignIntervention(1, { slot_id: 5 })).rejects.toMatchObject({ status: 409 });
        expect(slotRepository.findBookableInfo).not.toHaveBeenCalled();
    });

    it("lève une 404 si le nouveau créneau est introuvable", async () => {
        interventionRepository.findById.mockResolvedValue({ intervention_id: 1, address_id: 3, state: 'prochainement' });
        slotRepository.findBookableInfo.mockResolvedValue(null);

        await expect(interventionService.reassignIntervention(1, { slot_id: 5 })).rejects.toMatchObject({ status: 404 });
    });

    it("lève une 409 si le nouveau créneau n'est plus disponible", async () => {
        interventionRepository.findById.mockResolvedValue({ intervention_id: 1, address_id: 3, state: 'prochainement' });
        slotRepository.findBookableInfo.mockResolvedValue({ slot_id: 5, zone_id: 2, technician_id: 7, bookable: false });

        await expect(interventionService.reassignIntervention(1, { slot_id: 5 })).rejects.toMatchObject({ status: 409 });
        expect(addressRepository.findById).not.toHaveBeenCalled();
    });

    it("lève une 409 si le forfait du nouveau créneau diffère de celui de l'intervention", async () => {
        interventionRepository.findById.mockResolvedValue({ intervention_id: 1, slot_id: 4, address_id: 3, state: 'prochainement' });
        slotRepository.findBookableInfo.mockResolvedValue({ slot_id: 5, zone_id: 2, fee_id: 2, technician_id: 7, bookable: true });
        slotRepository.findById.mockResolvedValue({ slot_id: 4, fee_id: 1 });

        await expect(interventionService.reassignIntervention(1, { slot_id: 5 })).rejects.toMatchObject({ status: 409 });
        expect(addressRepository.findById).not.toHaveBeenCalled();
    });

        it("lève une 409 si le technicien du nouveau créneau ne couvre pas la zone figée de l'intervention", async () => {
        interventionRepository.findById.mockResolvedValue({ intervention_id: 1, slot_id: 4, address_id: 3, zone_id: 26, state: 'prochainement' });
        slotRepository.findBookableInfo.mockResolvedValue({ slot_id: 5, fee_id: 1, technician_id: 7, bookable: true });
        slotRepository.findById.mockResolvedValue({ slot_id: 4, fee_id: 1 });
        zoneRepository.isTechnicianInActiveZone.mockResolvedValue(false);

        await expect(interventionService.reassignIntervention(1, { slot_id: 5 })).rejects.toMatchObject({ status: 409 });
        expect(zoneRepository.isTechnicianInActiveZone).toHaveBeenCalledWith(26, 7);
        expect(interventionRepository.reassign).not.toHaveBeenCalled();
    });

});
describe('interventionService.createIntervention (contrôles de zone, ADR-17)', () => {
    const input = { bike_id: 3, slot_id: 5, address_id: 9, product_ids: [] };

    beforeEach(() => {
        slotRepository.findBookableInfo.mockResolvedValue({ slot_id: 5, fee_id: 1, technician_id: 7, bookable: true });
        bikeRepository.findById.mockResolvedValue({ bike_id: 3, user_id: 1 });
    });

    it('lève une 404 si le créneau est introuvable', async () => {
        slotRepository.findBookableInfo.mockResolvedValue(null);

        await expect(interventionService.createIntervention(1, input)).rejects.toMatchObject({ status: 404 });
        expect(bikeRepository.findById).not.toHaveBeenCalled();
    });

    it("lève une 409 si le créneau n'est plus réservable", async () => {
        slotRepository.findBookableInfo.mockResolvedValue({ slot_id: 5, fee_id: 1, technician_id: 7, bookable: false });

        await expect(interventionService.createIntervention(1, input)).rejects.toMatchObject({ status: 409 });
        expect(bikeRepository.findById).not.toHaveBeenCalled();
    });

    it("lève une 404 si le vélo n'appartient pas au client", async () => {
        bikeRepository.findById.mockResolvedValue({ bike_id: 3, user_id: 2 });

        await expect(interventionService.createIntervention(1, input)).rejects.toMatchObject({ status: 404 });
        expect(addressRepository.findById).not.toHaveBeenCalled();
    });

    it("lève une 404 si l'adresse n'appartient pas au client", async () => {
        addressRepository.findById.mockResolvedValue({ address_id: 9, user_id: 2, zone_id: 26 });

        await expect(interventionService.createIntervention(1, input)).rejects.toMatchObject({ status: 404 });
        expect(zoneRepository.isTechnicianInActiveZone).not.toHaveBeenCalled();
    });

    it('refuse (409 FEE_INACTIVE) un créneau dont le forfait a été désactivé', async () => {
        addressRepository.findById.mockResolvedValue({ address_id: 9, user_id: 1, zone_id: 26 });
        zoneRepository.isTechnicianInActiveZone.mockResolvedValue(true);
        feesRepository.findById.mockResolvedValue({ fee_id: 1, price_fee: '30.00', is_active: false });

        await expect(interventionService.createIntervention(1, input)).rejects.toMatchObject({ status: 409, appCode: 'FEE_INACTIVE' });
        expect(productsRepository.findByIds).not.toHaveBeenCalled();
        expect(interventionRepository.create).not.toHaveBeenCalled();
    });

    it('lève une 400 si un produit demandé est introuvable ou indisponible', async () => {
        addressRepository.findById.mockResolvedValue({ address_id: 9, user_id: 1, zone_id: 26 });
        zoneRepository.isTechnicianInActiveZone.mockResolvedValue(true);
        feesRepository.findById.mockResolvedValue({ fee_id: 1, price_fee: '30.00', is_active: true });
        productsRepository.findByIds.mockResolvedValue([{ product_id: 4, price: '9.90' }]);

        await expect(interventionService.createIntervention(1, { ...input, product_ids: [4, 8] })).rejects.toMatchObject({ status: 400 });
        expect(productsRepository.findByIds).toHaveBeenCalledWith([4, 8]);
        expect(interventionRepository.create).not.toHaveBeenCalled();
    });

    it("lève une 409 si l'adresse n'est dans aucune zone desservie", async () => {
        addressRepository.findById.mockResolvedValue({ address_id: 9, user_id: 1, zone_id: null });

        await expect(interventionService.createIntervention(1, input)).rejects.toMatchObject({ status: 409 });
        expect(zoneRepository.isTechnicianInActiveZone).not.toHaveBeenCalled();
        expect(interventionRepository.create).not.toHaveBeenCalled();
    });

    it("lève une 409 si le technicien du créneau ne couvre pas la zone de l'adresse", async () => {
        addressRepository.findById.mockResolvedValue({ address_id: 9, user_id: 1, zone_id: 26 });
        zoneRepository.isTechnicianInActiveZone.mockResolvedValue(false);

        await expect(interventionService.createIntervention(1, input)).rejects.toMatchObject({ status: 409 });
        expect(zoneRepository.isTechnicianInActiveZone).toHaveBeenCalledWith(26, 7);
        expect(interventionRepository.create).not.toHaveBeenCalled();
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

        expect(interventionRepository.updateState).toHaveBeenCalledWith(42, 'en cours', 'prochainement');
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
        interventionRepository.findById.mockResolvedValue({ client_id: 1, technician_id: 9, state: 'en cours' });
        interventionRepository.addPhoto
            .mockResolvedValueOnce({ photo_id: 1, url: '/uploads/a.jpg' })
            .mockResolvedValueOnce({ photo_id: 2, url: '/uploads/b.jpg' });

        const result = await interventionService.addPhotos(9, 'technician', 42, [{ filename: 'a.jpg' }, { filename: 'b.jpg' }]);

        expect(interventionRepository.addPhoto).toHaveBeenCalledTimes(2);
        expect(interventionRepository.addPhoto).toHaveBeenNthCalledWith(1, 42, '/uploads/a.jpg');
        expect(interventionRepository.addPhoto).toHaveBeenNthCalledWith(2, 42, '/uploads/b.jpg');
        expect(result).toEqual([{ photo_id: 1, url: '/uploads/a.jpg' }, { photo_id: 2, url: '/uploads/b.jpg' }]);
    });

    it("refuse l'ajout de photo si l'intervention n'est plus en cours", async () => {
        interventionRepository.findById.mockResolvedValue({ client_id: 1, technician_id: 9, state: 'terminée' });

        await expect(interventionService.addPhotos(9, 'technician', 42, [])).rejects.toMatchObject({ status: 409 });
        expect(interventionRepository.addPhoto).not.toHaveBeenCalled();
    });

    it("accepte les photos du client dès la réservation (état 'prochainement')", async () => {
        interventionRepository.findById.mockResolvedValue({ client_id: 1, technician_id: 9, state: 'prochainement' });
        interventionRepository.addPhoto.mockResolvedValueOnce({ photo_id: 1, url: '/uploads/a.jpg' });

        const result = await interventionService.addPhotos(1, 'client', 42, [{ filename: 'a.jpg' }]);

        expect(interventionRepository.addPhoto).toHaveBeenCalledWith(42, '/uploads/a.jpg');
        expect(result).toEqual([{ photo_id: 1, url: '/uploads/a.jpg' }]);
    });

    it("refuse les photos du technicien tant que l'intervention n'a pas démarré", async () => {
        interventionRepository.findById.mockResolvedValue({ client_id: 1, technician_id: 9, state: 'prochainement' });

        await expect(interventionService.addPhotos(9, 'technician', 42, [])).rejects.toMatchObject({ status: 409 });
        expect(interventionRepository.addPhoto).not.toHaveBeenCalled();
    });
});

describe('interventionService — état modifié entre la lecture et l\'écriture', () => {
    it("lève une 409 si l'annulation ne trouve plus l'intervention dans un état annulable", async () => {
        interventionRepository.findById.mockResolvedValue({ intervention_id: 1, client_id: 1, technician_id: 9, state: 'prochainement' });
        interventionRepository.cancel.mockResolvedValue(null);

        await expect(interventionService.cancelIntervention(1, 'client', 1)).rejects.toMatchObject({ status: 409 });
    });

    it("lève une 409 si le démarrage ne trouve plus l'intervention 'prochainement'", async () => {
        interventionRepository.findById.mockResolvedValue({ technician_id: 9, state: 'prochainement' });
        interventionRepository.updateState.mockResolvedValue(null);

        await expect(interventionService.startIntervention(9, 42)).rejects.toMatchObject({ status: 409 });
    });

    it("lève une 409 si la clôture ne trouve plus l'intervention 'en cours'", async () => {
        interventionRepository.findById.mockResolvedValue({ technician_id: 9, state: 'en cours' });
        interventionRepository.complete.mockResolvedValue(null);

        await expect(interventionService.completeIntervention(9, 42, { total_price: 50, is_paid: true })).rejects.toMatchObject({ status: 409 });
    });
});

describe('interventionService.getPlanning', () => {
    it('transmet la période et les filtres au repository', async () => {
        interventionRepository.findForPlanning.mockResolvedValue([{ intervention_id: 1 }]);

        const result = await interventionService.getPlanning({ start: '2026-11-09', end: '2026-11-16', technician_id: 3, zone_id: undefined });

        expect(interventionRepository.findForPlanning).toHaveBeenCalledWith({ start: '2026-11-09', end: '2026-11-16', technicianId: 3, zoneId: undefined });
        expect(result).toEqual({ interventions: [{ intervention_id: 1 }] });
    });
});

describe('interventionService.createIntervention — transaction', () => {
    const input = { bike_id: 3, slot_id: 5, address_id: 9, product_ids: [4, 8] };
    const address = { address_id: 9, user_id: 1, zone_id: 26, address_name: '1 rue de Lyon', city: 'Lyon' };
    const products = [{ product_id: 4, price: '9.90' }, { product_id: 8, price: '15.00' }];
    let client;

    beforeEach(() => {
        client = { query: vi.fn().mockResolvedValue({}), release: vi.fn() };
        db.getClient.mockResolvedValue(client);
        slotRepository.findBookableInfo.mockResolvedValue({ slot_id: 5, fee_id: 1, technician_id: 7, bookable: true });
        bikeRepository.findById.mockResolvedValue({ bike_id: 3, user_id: 1 });
        addressRepository.findById.mockResolvedValue(address);
        zoneRepository.isTechnicianInActiveZone.mockResolvedValue(true);
        feesRepository.findById.mockResolvedValue({ fee_id: 1, price_fee: '30.00', is_active: true });
        productsRepository.findByIds.mockResolvedValue(products);
        interventionRepository.create.mockResolvedValue({ intervention_id: 42, zone_id: 26 });
    });

    it("crée l'intervention et ses produits dans une transaction validée, avec les prix figés", async () => {
        const result = await interventionService.createIntervention(1, input);

        expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
        expect(interventionRepository.create).toHaveBeenCalledWith({
            bikeId: 3,
            slotId: 5,
            technicianId: 7,
            clientId: 1,
            address,
            totalPrice: 54.9,
            feePrice: '30.00',
        }, client);
        expect(interventionRepository.addProduct).toHaveBeenNthCalledWith(1, 42, 4, '9.90', client);
        expect(interventionRepository.addProduct).toHaveBeenNthCalledWith(2, 42, 8, '15.00', client);
        expect(client.query).toHaveBeenLastCalledWith('COMMIT');
        expect(client.release).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ intervention_id: 42, zone_id: 26 });
    });

    it('transforme un créneau réservé entre-temps (23505) en 409 et annule la transaction', async () => {
        interventionRepository.create.mockRejectedValue(Object.assign(new Error('duplicate key'), { code: '23505' }));

        await expect(interventionService.createIntervention(1, input)).rejects.toMatchObject({
            status: 409,
            message: "Ce créneau vient d'être réservé par quelqu'un d'autre, merci d'en choisir un autre.",
        });
        expect(client.query).toHaveBeenCalledWith('ROLLBACK');
        expect(client.query).not.toHaveBeenCalledWith('COMMIT');
        expect(interventionRepository.addProduct).not.toHaveBeenCalled();
        expect(client.release).toHaveBeenCalledTimes(1);
    });

    it('transforme un créneau supprimé entre-temps (23503) en 409 et annule la transaction', async () => {
        interventionRepository.create.mockRejectedValue(Object.assign(new Error('foreign key'), { code: '23503' }));

        await expect(interventionService.createIntervention(1, input)).rejects.toMatchObject({
            status: 409,
            message: "Ce créneau n'est plus disponible, merci d'en choisir un autre.",
        });
        expect(client.query).toHaveBeenCalledWith('ROLLBACK');
        expect(client.release).toHaveBeenCalledTimes(1);
    });

    it("annule toute la réservation si l'ajout d'un produit échoue, et relance l'erreur", async () => {
        interventionRepository.addProduct
            .mockResolvedValueOnce(undefined)
            .mockRejectedValueOnce(new Error('connexion perdue'));

        await expect(interventionService.createIntervention(1, input)).rejects.toThrow('connexion perdue');
        expect(client.query).toHaveBeenCalledWith('ROLLBACK');
        expect(client.query).not.toHaveBeenCalledWith('COMMIT');
        expect(client.release).toHaveBeenCalledTimes(1);
    });
});

describe('interventionService.reassignIntervention — transaction', () => {
    let client;

    beforeEach(() => {
        client = { query: vi.fn().mockResolvedValue({}), release: vi.fn() };
        db.getClient.mockResolvedValue(client);
        interventionRepository.findById.mockResolvedValue({ intervention_id: 1, slot_id: 4, zone_id: 26, state: 'prochainement' });
        slotRepository.findBookableInfo.mockResolvedValue({ slot_id: 5, fee_id: 1, technician_id: 7, bookable: true });
        slotRepository.findById.mockResolvedValue({ slot_id: 4, fee_id: 1 });
        zoneRepository.isTechnicianInActiveZone.mockResolvedValue(true);
        interventionRepository.reassign.mockResolvedValue({ intervention_id: 1, slot_id: 5, technician_id: 7 });
    });

    it("réassigne l'intervention au nouveau créneau et à son technicien dans une transaction validée", async () => {
        const result = await interventionService.reassignIntervention(1, { slot_id: 5 });

        expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
        expect(interventionRepository.reassign).toHaveBeenCalledWith(1, { slotId: 5, technicianId: 7 }, client);
        expect(client.query).toHaveBeenLastCalledWith('COMMIT');
        expect(client.release).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ intervention_id: 1, slot_id: 5, technician_id: 7 });
    });

    it('transforme un créneau réservé entre-temps (23505) en 409 et annule la transaction', async () => {
        interventionRepository.reassign.mockRejectedValue(Object.assign(new Error('duplicate key'), { code: '23505' }));

        await expect(interventionService.reassignIntervention(1, { slot_id: 5 })).rejects.toMatchObject({ status: 409 });
        expect(client.query).toHaveBeenCalledWith('ROLLBACK');
        expect(client.query).not.toHaveBeenCalledWith('COMMIT');
        expect(client.release).toHaveBeenCalledTimes(1);
    });

    it('transforme un créneau supprimé entre-temps (23503) en 409 et annule la transaction', async () => {
        interventionRepository.reassign.mockRejectedValue(Object.assign(new Error('foreign key'), { code: '23503' }));

        await expect(interventionService.reassignIntervention(1, { slot_id: 5 })).rejects.toMatchObject({
            status: 409,
            message: "Ce créneau n'est plus disponible, merci d'en choisir un autre.",
        });
        expect(client.query).toHaveBeenCalledWith('ROLLBACK');
        expect(client.release).toHaveBeenCalledTimes(1);
    });

    it('relance telle quelle une autre erreur, après avoir annulé la transaction', async () => {
        interventionRepository.reassign.mockRejectedValue(new Error('connexion perdue'));

        await expect(interventionService.reassignIntervention(1, { slot_id: 5 })).rejects.toThrow('connexion perdue');
        expect(client.query).toHaveBeenCalledWith('ROLLBACK');
        expect(client.release).toHaveBeenCalledTimes(1);
    });
});