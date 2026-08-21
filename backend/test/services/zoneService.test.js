import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as zoneRepository from '../../src/repositories/zoneRepository.js';
import * as userRepository from '../../src/repositories/userRepository.js';
import * as zoneService from '../../src/services/zoneService.js';

vi.mock('../../src/repositories/zoneRepository.js');
vi.mock('../../src/repositories/userRepository.js');

const baseZone = { zone_id: 1, name: 'Lyon 1er', color: '#3388ff', is_active: true };

beforeEach(() => {
    vi.resetAllMocks();
});

describe('zoneService.getAllZones', () => {
    it('renvoie toutes les zones du repository', async () => {
        zoneRepository.findAll.mockResolvedValue([baseZone]);

        const result = await zoneService.getAllZones();

        expect(result).toEqual([baseZone]);
    });
});

describe('zoneService.createZone', () => {
    it('délègue la création au repository', async () => {
        zoneRepository.create.mockResolvedValue(baseZone);

        const result = await zoneService.createZone({ name: 'Lyon 1er' });

        expect(zoneRepository.create).toHaveBeenCalledWith({ name: 'Lyon 1er' });
        expect(result).toEqual(baseZone);
    });
});

describe('zoneService.updateZone', () => {
    it('lève une 404 si la zone est introuvable', async () => {
        zoneRepository.update.mockResolvedValue(undefined);

        await expect(zoneService.updateZone(99, { name: 'x' })).rejects.toMatchObject({ status: 404 });
    });

    it('renvoie la zone mise à jour', async () => {
        zoneRepository.update.mockResolvedValue(baseZone);

        const result = await zoneService.updateZone(1, { name: 'Lyon 1er' });

        expect(result).toEqual(baseZone);
    });
});

describe('zoneService.desactivateZone', () => {
    it('lève une 404 si la zone est introuvable', async () => {
        zoneRepository.desactivate.mockResolvedValue(undefined);

        await expect(zoneService.desactivateZone(99)).rejects.toMatchObject({ status: 404 });
    });

    it('désactive la zone', async () => {
        zoneRepository.desactivate.mockResolvedValue({ zone_id: 1 });

        const result = await zoneService.desactivateZone(1);

        expect(result).toEqual({ zone_id: 1 });
    });
});

describe('zoneService.deleteZone', () => {
    it('lève une 404 si la zone est introuvable', async () => {
        zoneRepository.findById.mockResolvedValue(null);

        await expect(zoneService.deleteZone(99)).rejects.toMatchObject({ status: 404 });
        expect(zoneRepository.countReferences).not.toHaveBeenCalled();
    });

    it('lève une 409 si des adresses référencent encore la zone', async () => {
        zoneRepository.findById.mockResolvedValue(baseZone);
        zoneRepository.countReferences.mockResolvedValue({ addressCount: 2, slotCount: 0 });

        await expect(zoneService.deleteZone(1)).rejects.toMatchObject({ status: 409 });
        expect(zoneRepository.remove).not.toHaveBeenCalled();
    });

    it('lève une 409 si des créneaux référencent encore la zone', async () => {
        zoneRepository.findById.mockResolvedValue(baseZone);
        zoneRepository.countReferences.mockResolvedValue({ addressCount: 0, slotCount: 1 });

        await expect(zoneService.deleteZone(1)).rejects.toMatchObject({ status: 409 });
        expect(zoneRepository.remove).not.toHaveBeenCalled();
    });

    it('supprime la zone si aucune référence ne subsiste', async () => {
        zoneRepository.findById.mockResolvedValue(baseZone);
        zoneRepository.countReferences.mockResolvedValue({ addressCount: 0, slotCount: 0 });
        zoneRepository.remove.mockResolvedValue({ zone_id: 1 });

        await zoneService.deleteZone(1);

        expect(zoneRepository.remove).toHaveBeenCalledWith(1);
    });
});

describe('zoneService.assignTechnician', () => {
    it('lève une 404 si la zone est introuvable', async () => {
        zoneRepository.findById.mockResolvedValue(null);

        await expect(zoneService.assignTechnician(99, 1)).rejects.toMatchObject({ status: 404 });
    });

    it("lève une 404 si l'utilisateur n'existe pas ou n'est pas technicien", async () => {
        zoneRepository.findById.mockResolvedValue(baseZone);
        userRepository.findById.mockResolvedValue({ user_id: 1, role: 'client' });

        await expect(zoneService.assignTechnician(1, 1)).rejects.toMatchObject({ status: 404 });
        expect(zoneRepository.assignTechnician).not.toHaveBeenCalled();
    });

    it('assigne le technicien à la zone', async () => {
        zoneRepository.findById.mockResolvedValue(baseZone);
        userRepository.findById.mockResolvedValue({ user_id: 2, role: 'technician' });

        await zoneService.assignTechnician(1, 2);

        expect(zoneRepository.assignTechnician).toHaveBeenCalledWith(1, 2);
    });
});

describe('zoneService.unassignTechnician', () => {
    it('délègue la désassignation au repository', async () => {
        await zoneService.unassignTechnician(1, 2);

        expect(zoneRepository.unassignTechnician).toHaveBeenCalledWith(1, 2);
    });
});

describe('zoneService.findZoneForPoint', () => {
    it('délègue au repository avec les coordonnées reçues', async () => {
        zoneRepository.findZoneForPoint.mockResolvedValue(3);

        const result = await zoneService.findZoneForPoint(45.76, 4.83);

        expect(zoneRepository.findZoneForPoint).toHaveBeenCalledWith(45.76, 4.83);
        expect(result).toBe(3);
    });
});

describe('zoneService.getZoneTechnicians', () => {
    it('lève une 404 si la zone est introuvable', async () => {
        zoneRepository.findById.mockResolvedValue(null);

        await expect(zoneService.getZoneTechnicians(99)).rejects.toMatchObject({ status: 404 });
    });

    it('renvoie les techniciens assignés à la zone', async () => {
        zoneRepository.findById.mockResolvedValue(baseZone);
        zoneRepository.findTechniciansByZone.mockResolvedValue([{ user_id: 2, name: 'Tech' }]);

        const result = await zoneService.getZoneTechnicians(1);

        expect(result).toEqual([{ user_id: 2, name: 'Tech' }]);
    });
});
