import * as slotRepository from '../repositories/slotRepository.js';
import * as zoneRepository from '../repositories/zoneRepository.js';
import * as feesRepository from '../repositories/feesRepository.js';
import * as userRepository from '../repositories/userRepository.js';

export async function getAvailableSlots({ zone_id, fee_id, day }) {
    return await slotRepository.findByZoneFeeDay(zone_id, fee_id, day);
}

export async function createSlot({ day, start_at, ended_at, zone_id, fee_id, technician_id }) {
    if (start_at >= ended_at) {
        const err = new Error("L'heure de fin doit être après l'heure de début");
        err.status = 400;
        throw err;
    }

    const zone = await zoneRepository.findById(zone_id);
    if (!zone || !zone.is_active) {
        const err = new Error('Zone introuvable ou inactive');
        err.status = 404;
        throw err;
    }

    const fee = await feesRepository.findById(fee_id);
    if (!fee || !fee.is_active) {
        const err = new Error('Forfait introuvable ou inactif');
        err.status = 404;
        throw err;
    }

    const technician = await userRepository.findById(technician_id);
    if (!technician || technician.role !== 'technician' || !technician.is_active) {
        const err = new Error('Technicien introuvable ou inactif');
        err.status = 404;
        throw err;
    }

    const assigned = await zoneRepository.isTechnicianInZone(zone_id, technician_id);
    if (!assigned) {
        const err = new Error("Ce technicien n'est pas positionné sur cette zone");
        err.status = 409;
        throw err;
    }

    const overlaps = await slotRepository.findOverlapping(technician_id, day, start_at, ended_at);
    if (overlaps) {
        const err = new Error('Ce créneau chevauche un autre créneau déjà existant pour ce technicien');
        err.status = 409;
        throw err;
    }

    return slotRepository.create({ day, startAt: start_at, endedAt: ended_at, zoneId: zone_id, feeId: fee_id, technicianId: technician_id });
}

export async function deleteSlot(slotId) {
    const slot = await slotRepository.findById(slotId);
    if (!slot) {
        const err = new Error('Créneau introuvable');
        err.status = 404;
        throw err;
    }
    const interventionsCount = await slotRepository.countInterventions(slotId);
    if (interventionsCount > 0) {
        const err = new Error('Ce créneau est déjà lié à une intervention, suppression refusée');
        err.status = 409;
        throw err;
    }
    await slotRepository.remove(slotId);
}
