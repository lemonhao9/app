import * as zoneRepository from '../repositories/zoneRepository.js';

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