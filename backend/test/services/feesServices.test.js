import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as feesRepository from '../../src/repositories/feesRepository.js';
import * as db from '../../src/utils/db.js';
import * as slotGenerationService from '../../src/services/slotGenerationService.js';
import * as feesServices from '../../src/services/feesServices.js';

vi.mock('../../src/repositories/feesRepository.js');
vi.mock('../../src/utils/db.js');
vi.mock('../../src/services/slotGenerationService.js');

const baseFee = { fee_id: 1, name_fee: 'Diag', duration: 45, is_active: true };

beforeEach(() => {
    vi.resetAllMocks();
});

describe('feesServices.getAllActiveFees / getAllFees', () => {
    it('renvoie les forfaits actifs du repository', async () => {
        feesRepository.findAllActive.mockResolvedValue([baseFee]);

        expect(await feesServices.getAllActiveFees()).toEqual([baseFee]);
    });

    it('renvoie tous les forfaits, actifs ou non', async () => {
        feesRepository.findAll.mockResolvedValue([baseFee, { ...baseFee, fee_id: 2, is_active: false }]);

        expect(await feesServices.getAllFees()).toHaveLength(2);
    });
});

describe('feesServices.createFee / updateFee', () => {
    it('crée le forfait et le renvoie', async () => {
        feesRepository.create.mockResolvedValue(baseFee);

        const fee = await feesServices.createFee({ name_fee: 'Diag', duration: 45, price_fee: 30 });

        expect(feesRepository.create).toHaveBeenCalledWith({ name_fee: 'Diag', duration: 45, price_fee: 30 });
        expect(fee).toEqual(baseFee);
    });

    it('met à jour le forfait et le renvoie', async () => {
        feesRepository.update.mockResolvedValue({ ...baseFee, duration: 60 });

        const fee = await feesServices.updateFee(1, { duration: 60 });

        expect(feesRepository.update).toHaveBeenCalledWith(1, { duration: 60 });
        expect(fee.duration).toBe(60);
    });
});

describe('feesServices.desactivateFee / activateFee', () => {
    it('désactive le forfait', async () => {
        feesRepository.desactivate.mockResolvedValue({ fee_id: 1 });

        expect(await feesServices.desactivateFee(1)).toEqual({ fee_id: 1 });
    });

    it('réactive le forfait', async () => {
        feesRepository.activate.mockResolvedValue({ fee_id: 1 });

        expect(await feesServices.activateFee(1)).toEqual({ fee_id: 1 });
    });
});

describe('feesServices.deleteFee', () => {
    let client;

    beforeEach(() => {
        client = { query: vi.fn().mockResolvedValue({}), release: vi.fn() };
        db.getClient.mockResolvedValue(client);
    });

    it('lève une 404 si le forfait est introuvable', async () => {
        feesRepository.findById.mockResolvedValue(null);

        await expect(feesServices.deleteFee(99)).rejects.toMatchObject({ status: 404 });
        expect(db.getClient).not.toHaveBeenCalled();
    });

    it('refuse (409) la suppression d\'un forfait déjà utilisé par des interventions', async () => {
        feesRepository.findById.mockResolvedValue(baseFee);
        feesRepository.countReferences.mockResolvedValue({ interventionCount: 2 });

        await expect(feesServices.deleteFee(1)).rejects.toMatchObject({ status: 409 });
        expect(feesRepository.remove).not.toHaveBeenCalled();
        expect(db.getClient).not.toHaveBeenCalled();
    });

    it('supprime ses créneaux puis le forfait dans une transaction, puis relance la génération', async () => {
        feesRepository.findById.mockResolvedValue(baseFee);
        feesRepository.countReferences.mockResolvedValue({ interventionCount: 0 });

        await feesServices.deleteFee(1);

        expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
        expect(feesRepository.removeSlots).toHaveBeenCalledWith(1, client);
        expect(feesRepository.remove).toHaveBeenCalledWith(1, client);
        expect(client.query).toHaveBeenLastCalledWith('COMMIT');
        expect(client.release).toHaveBeenCalled();
        expect(slotGenerationService.syncSlotsInBackground).toHaveBeenCalledTimes(1);
    });

    it('transforme une violation de clé étrangère (23503) en 409 et annule la transaction', async () => {
        feesRepository.findById.mockResolvedValue(baseFee);
        feesRepository.countReferences.mockResolvedValue({ interventionCount: 0 });
        feesRepository.removeSlots.mockRejectedValue(Object.assign(new Error('fk'), { code: '23503' }));

        await expect(feesServices.deleteFee(1)).rejects.toMatchObject({ status: 409 });
        expect(client.query).toHaveBeenCalledWith('ROLLBACK');
        expect(client.query).not.toHaveBeenCalledWith('COMMIT');
        expect(client.release).toHaveBeenCalled();
        expect(slotGenerationService.syncSlotsInBackground).not.toHaveBeenCalled();
    });

    it('relance telle quelle une autre erreur, après avoir annulé la transaction', async () => {
        feesRepository.findById.mockResolvedValue(baseFee);
        feesRepository.countReferences.mockResolvedValue({ interventionCount: 0 });
        feesRepository.remove.mockRejectedValue(new Error('connexion perdue'));

        await expect(feesServices.deleteFee(1)).rejects.toThrow('connexion perdue');
        expect(client.query).toHaveBeenCalledWith('ROLLBACK');
        expect(client.release).toHaveBeenCalled();
    });
});

describe('feesServices — resynchronisation des créneaux', () => {
    it('relance la génération après la création d\'un forfait', async () => {
        feesRepository.create.mockResolvedValue({ fee_id: 5 });

        await feesServices.createFee({ name_fee: 'Express', duration: 30, price_fee: 20 });

        expect(slotGenerationService.syncSlotsInBackground).toHaveBeenCalledTimes(1);
    });

    it('relance la génération après une modification, une désactivation ou une réactivation', async () => {
        feesRepository.update.mockResolvedValue({ fee_id: 1 });
        feesRepository.desactivate.mockResolvedValue({ fee_id: 1 });
        feesRepository.activate.mockResolvedValue({ fee_id: 1 });

        await feesServices.updateFee(1, { duration: 90 });
        await feesServices.desactivateFee(1);
        await feesServices.activateFee(1);

        expect(slotGenerationService.syncSlotsInBackground).toHaveBeenCalledTimes(3);
    });

    it('ne relance rien si le forfait est introuvable', async () => {
        feesRepository.update.mockResolvedValue(null);
        feesRepository.desactivate.mockResolvedValue(null);
        feesRepository.activate.mockResolvedValue(null);

        await expect(feesServices.updateFee(99, { duration: 90 })).rejects.toMatchObject({ status: 404 });
        await expect(feesServices.desactivateFee(99)).rejects.toMatchObject({ status: 404 });
        await expect(feesServices.activateFee(99)).rejects.toMatchObject({ status: 404 });

        expect(slotGenerationService.syncSlotsInBackground).not.toHaveBeenCalled();
    });
});