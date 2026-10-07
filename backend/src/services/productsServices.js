import * as productsRepository from '../repositories/productsRepository.js';

export async function getAllActiveProducts() {
    return await productsRepository.findAllActive();
}

export async function getAllProducts() {
    return await productsRepository.findAll();
}

export async function createProduct(data) {
    return await productsRepository.create(data);
}

export async function updateProduct(productId, data) {
    const product = await productsRepository.update(productId, data);
    if (!product) {
        const err = new Error('Produit introuvable');
        err.status = 404;
        throw err;
    }
    return product;
}

export async function desactivateProduct(productId) {
    const product = await productsRepository.desactivate(productId);
    if (!product) {
        const err = new Error('Produit introuvable');
        err.status = 404;
        throw err;
    }
    return product;
}

export async function deleteProduct(productId) {
    const product = await productsRepository.findById(productId);
    if (!product) {
        const err = new Error('Produit introuvable');
        err.status = 404;
        throw err;
    }
    const { ajouterCount } = await productsRepository.countReferences(productId);
    if (ajouterCount > 0) {
        const err = new Error('Produit encore référencé par des interventions, suppression refusée');
        err.status = 409;
        throw err;
    }
    await productsRepository.remove(productId);
}
