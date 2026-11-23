import * as companyRepository from '../repositories/companyRepository.js';

export async function getCompany() {
    const company = await companyRepository.find();
    if (!company) {
        const err = new Error('Informations de la société introuvables');
        err.status = 404;
        throw err;
    }
    return company;
}
