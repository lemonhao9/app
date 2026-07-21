import * as bikeRepository from '../repositories/bikeRepository.js';

export async function getMyBikes(userId) {
    return await bikeRepository.findByUserId(userId);
}