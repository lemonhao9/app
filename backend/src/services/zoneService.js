import * as zoneRepository from '../repositories/zoneRepository.js';
import * as userRepository from '../repositories/userRepository.js';

export async function getAllZones() {
    return await zoneRepository.findAll();
}

export async function createZone(data) {
    return await zoneRepository.create(data);
}

export async function updateZone(zoneId, data) {
    const zone = await zoneRepository.update(zoneId, data);
    if(!zone) {
        const err = new Error ('Zone introuvable');
        err.status = 404;
        throw err;
    }
    return zone;
}

export async function desactivateZone(zoneId) {
    const zone = await zoneRepository.desactivate(zoneId);
    if(!zone) {
        const err = new Error ('Zone introuvable');
        err.status = 404;
        throw err;
    }
    return zone;
}

export async function deleteZone(zoneId) {
    const zone = await zoneRepository.findById(zoneId);
    if(!zone) {
        const err = new Error ('Zone introuvable');
        err.status = 404;
        throw err;
    }
    const { addressCount, slotCount } = await zoneRepository.countReferences(zoneId);
    if (addressCount > 0 || slotCount > 0) {
        const err = new Error('Zone encore référencée par des adresses ou des créneaux, suppression refusée');
        err.status = 409;
        throw err;
    }
    await zoneRepository.remove(zoneId);
}

export async function assignTechnician(zoneId, userId) {
    const zone = await zoneRepository.findById(zoneId);
    if(!zone) {
        const err = new Error ('Zone introuvable');
        err.status = 404;
        throw err;
    }
    const user = await userRepository.findById(userId);
    if(!user || user.role !== 'technician') {
        const err = new Error ('Technicien introuvable');
        err.status = 404;
        throw err;
    }
    await zoneRepository.assignTechnician(zoneId, userId);
}

export async function unassignTechnician(zoneId, userId) {
    await zoneRepository.unassignTechnician(zoneId, userId);
}

export async function findZoneForPoint(latitude, longitude) {
    return await zoneRepository.findZoneForPoint(latitude, longitude);
}

export async function getZoneTechnicians(zoneId) {
    const zone = await zoneRepository.findById(zoneId);
    if(!zone) {
        const err = new Error ('Zone introuvable');
        err.status = 404;
        throw err;
    }
    return zoneRepository.findTechniciansByZone(zoneId);
}