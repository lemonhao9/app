import * as feesRepository from '../repositories/feesRepository.js';
import { getClient} from '../utils/db.js';

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

export async function activateFee(feeId) {
    const fee = await feesRepository.activate(feeId);
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
    const { interventionCount } = await feesRepository.countReferences(feeId);
    if (interventionCount > 0) {
        const err = new Error("Forfait déjà utilisé par des interventions : suppression refusée, il reste désactivé pour conserver l'historique");
        err.status = 409;
        throw err;
    }
    const client = await getClient();
    try {
        await client.query('BEGIN');
        await feesRepository.removeSlots(feeId, client);
        await feesRepository.remove(feeId, client);
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === '23503') {
            const conflict = new Error("Forfait déjà utilisé par des interventions : suppression refusée, il reste désactivé pour conserver l'historique");
            conflict.status = 409;
            throw conflict;
        }
        throw err;
    } finally {
        client.release();
    }
}
