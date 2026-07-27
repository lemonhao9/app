import * as bikeRepository from '../repositories/bikeRepository.js';

export async function getMyBikes(userId) {
    return await bikeRepository.findByUserId(userId);
}

export async function addBike(userId, data) {
    return bikeRepository.create({ ...data, userId});
}

export async function updateBike(userId, bikeId, data) {
    const bike = await bikeRepository.findById(bikeId);
    if (!bike || bike.user_id !== userId) {
        const err = new Error('Vélo introuvable');
        err.status = 404;
        throw err;
    }
    const photo = data.photo ?? bike.photo; // Pour garder l'ancienne photo si aucune nouvelle n'est fournie
    return bikeRepository.update({ bikeId, ...data, photo });
}