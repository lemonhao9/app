import * as bikeRepository from '../repositories/bikeRepository.js';
import { deletePhotoFile } from '../utils/fileStorage.js';

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
    const photo = data.photo ?? bike.photo;
    if (data.photo && bike.photo && data.photo !== bike.photo) deletePhotoFile(bike.photo);
    return bikeRepository.update({
        bikeId,
        brand: data.brand ?? bike.brand,
        model: data.model ?? bike.model,
        year: data.year ?? bike.year,
        bike_type: data.bike_type ?? bike.bike_type,
        is_electric: data.is_electric ?? bike.is_electric,
        photo,
    });
}

export async function deleteBike(userId, bikeId) {
    const bike = await bikeRepository.findById(bikeId);
    if (!bike || bike.user_id !== userId) {
        const err = new Error ('Vélo introuvable');
        err.status = 404;
        throw err;
    }
    await bikeRepository.remove(bikeId);
    deletePhotoFile(bike.photo);
}

