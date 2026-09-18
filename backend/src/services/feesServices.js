import * as feesRepository from '../repositories/feesRepository.js';

export async function getAllActiveFees() {
    return await feesRepository.findAllActive();
}

export async function getAllFees() {
    return await feesRepository.findAll();
}

export async function createFee(data) {
    return await feesRepository.create(data);
}

export async function updateFee(feeId, data) {
    const fee = await feesRepository.update(feeId, data);
    if (!fee) {
        const err = new Error('Forfait introuvable');
        err.status = 404;
        throw err;
    }
    return fee;
}

export async function desactivateFee(feeId) {
    const fee = await feesRepository.desactivate(feeId);
    if (!fee) {
        const err = new Error('Forfait introuvable');
        err.status = 404;
        throw err;
    }
    return fee;
}

export async function deleteFee(feeId) {
    const fee = await feesRepository.findById(feeId);
    if (!fee) {
        const err = new Error('Forfait introuvable');
        err.status = 404;
        throw err;
    }
    const { slotCount } = await feesRepository.countReferences(feeId);
    if (slotCount > 0) {
        const err = new Error('Forfait encore référencé par des créneaux, suppression refusée');
        err.status = 409;
        throw err;
    }
    await feesRepository.remove(feeId);
}
