import * as bikeRepository from '../repositories/bikeRepository.js';
import fs from 'fs/promises';
import path from 'path';

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
    if (data.photo && bike.photo && data.photo !== bike.photo) deletePhotoFile(bike.photo);
    return bikeRepository.update({ bikeId, ...data, photo });
}

function deletePhotoFile(photoUrl) {
    if (!photoUrl) return;
    const filePath = path.join(process.cwd(), 'uploads', path.basename(photoUrl));
    fs.unlink(filePath).catch(() => {});
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