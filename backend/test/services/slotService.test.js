import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as slotRepository from '../../src/repositories/slotRepository.js';
import * as zoneRepository from '../../src/repositories/zoneRepository.js';
import * as feesRepository from '../../src/repositories/feesRepository.js';
import * as userRepository from '../../src/repositories/userRepository.js';
import * as slotService from '../../src/services/slotService.js';

vi.mock('../../src/repositories/slotRepository.js');
vi.mock('../../src/repositories/zoneRepository.js');
vi.mock('../../src/repositories/feesRepository.js');
vi.mock('../../src/repositories/userRepository.js');

const validInput = {
    day: '2026-09-20',
    start_at: '09:00:00',
    ended_at: '10:00:00',
    zone_id: 1,
    fee_id: 1,
    technician_id: 1,
};

beforeEach(() => {
    vi.resetAllMocks();
    zoneRepository.findById.mockResolvedValue({ zone_id: 1, is_active: true });
    feesRepository.findById.mockResolvedValue({ fee_id: 1, is_active: true });
    userRepository.findById.mockResolvedValue({ user_id: 1, role: 'technician', is_active: true });
    zoneRepository.isTechnicianInZone.mockResolvedValue(true);
    slotRepository.findOverlapping.mockResolvedValue(false);
});

describe('slotService.createSlot', () => {
    it("lève une 400 si l'heure de fin n'est pas après l'heure de début", async () => {
        await expect(slotService.createSlot({ ...validInput, start_at: '10:00:00', ended_at: '10:00:00' }))
            .rejects.toMatchObject({ status: 400 });
    });

    it('lève une 404 si la zone est introuvable ou inactive', async () => {
        zoneRepository.findById.mockResolvedValue(null);
        await expect(slotService.createSlot(validInput)).rejects.toMatchObject({ status: 404 });
    });

    it('lève une 404 si le forfait est introuvable ou inactif', async () => {
        feesRepository.findById.mockResolvedValue({ fee_id: 1, is_active: false });
        await expect(slotService.createSlot(validInput)).rejects.toMatchObject({ status: 404 });
    });

    it("lève une 404 si l'utilisateur n'est pas un technicien actif", async () => {
        userRepository.findById.mockResolvedValue({ user_id: 1, role: 'client', is_active: true });
        await expect(slotService.createSlot(validInput)).rejects.toMatchObject({ status: 404 });
    });

    it("lève une 409 si le technicien n'est pas positionné sur cette zone", async () => {
        zoneRepository.isTechnicianInZone.mockResolvedValue(false);
        await expect(slotService.createSlot(validInput)).rejects.toMatchObject({ status: 409 });
    });

    it('lève une 409 en cas de chevauchement', async () => {
        slotRepository.findOverlapping.mockResolvedValue(true);
        await expect(slotService.createSlot(validInput)).rejects.toMatchObject({ status: 409 });
    });

    it('crée le créneau si toutes les validations passent', async () => {
        slotRepository.create.mockResolvedValue({ slot_id: 1, ...validInput });

        const result = await slotService.createSlot(validInput);

        expect(slotRepository.create).toHaveBeenCalledWith({
            day: validInput.day,
            startAt: validInput.start_at,
            endedAt: validInput.ended_at,
            zoneId: validInput.zone_id,
            feeId: validInput.fee_id,
            technicianId: validInput.technician_id,
        });
        expect(result).toEqual({ slot_id: 1, ...validInput });
    });
});

describe('slotService.deleteSlot', () => {
    it('lève une 404 si le créneau est introuvable', async () => {
        slotRepository.findById.mockResolvedValue(null);
        await expect(slotService.deleteSlot(1)).rejects.toMatchObject({ status: 404 });
    });

    it('lève une 409 si le créneau est déjà lié à une intervention', async () => {
        slotRepository.findById.mockResolvedValue({ slot_id: 1 });
        slotRepository.countInterventions.mockResolvedValue(1);
        await expect(slotService.deleteSlot(1)).rejects.toMatchObject({ status: 409 });
    });

    it('supprime le créneau si rien ne le référence', async () => {
        slotRepository.findById.mockResolvedValue({ slot_id: 1 });
        slotRepository.countInterventions.mockResolvedValue(0);

        await slotService.deleteSlot(1);

        expect(slotRepository.remove).toHaveBeenCalledWith(1);
    });
});
