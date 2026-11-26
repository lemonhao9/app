import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as feesRepository from '../../src/repositories/feesRepository.js';
import * as slotGenerationService from '../../src/services/slotGenerationService.js';
import * as feesServices from '../../src/services/feesServices.js';

vi.mock('../../src/repositories/feesRepository.js');
vi.mock('../../src/services/slotGenerationService.js');

beforeEach(() => {
    vi.resetAllMocks();
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