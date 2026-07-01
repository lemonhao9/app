import * as productsRepository from '../repositories/productsRepository.js';

export async function getAllActiveProducts() {
    return await productsRepository.findAllActive();
}