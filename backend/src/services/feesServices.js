import * as feesRepository from '../repositories/feesRepository.js';

export async function getAllActiveFees() {
    return await feesRepository.findAllActive();
}