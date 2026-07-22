import * as bikeRepository from '../repositories/bikeRepository.js';

export async function getMyBikes(userId) {
    return await bikeRepository.findByUserId(userId);
}

export async function addBike(userId, data) {
    return bikeRepository.create({ ...data, userId});
}