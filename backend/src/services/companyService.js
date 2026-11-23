import * as companyRepository from '../repositories/companyRepository.js';

function notFound() {
    const err = new Error('Informations de la société introuvables');
    err.status = 404;
    return err;
}

export async function getCompany() {
    const company = await companyRepository.find();
    if (!company) throw notFound();
    return company;
}

export async function updateCompany(data) {
    const company = await companyRepository.update(data);
    if (!company) throw notFound();
    return company;
}
