import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as productsRepository from '../../src/repositories/productsRepository.js';
import * as productsServices from '../../src/services/productsServices.js';

vi.mock('../../src/repositories/productsRepository.js');

const baseProduct = { product_id: 1, name: 'Chambre à air', category: 'pneus', price: '9.90', is_active: true };

beforeEach(() => {
    vi.resetAllMocks();
});

describe('productsServices.getAllActiveProducts / getAllProducts', () => {
    it('renvoie les produits actifs du repository', async () => {
        productsRepository.findAllActive.mockResolvedValue([baseProduct]);

        expect(await productsServices.getAllActiveProducts()).toEqual([baseProduct]);
    });

    it('renvoie tous les produits, actifs ou non', async () => {
        productsRepository.findAll.mockResolvedValue([baseProduct, { ...baseProduct, product_id: 2, is_active: false }]);

        expect(await productsServices.getAllProducts()).toHaveLength(2);
    });
});

describe('productsServices.createProduct', () => {
    it('crée le produit et le renvoie', async () => {
        const data = { name: 'Chambre à air', category: 'pneus', price: 9.9 };
        productsRepository.create.mockResolvedValue(baseProduct);

        const product = await productsServices.createProduct(data);

        expect(productsRepository.create).toHaveBeenCalledWith(data);
        expect(product).toEqual(baseProduct);
    });
});

describe('productsServices.updateProduct', () => {
    it('lève une 404 si le produit est introuvable', async () => {
        productsRepository.update.mockResolvedValue(undefined);

        await expect(productsServices.updateProduct(99, { price: 12 })).rejects.toMatchObject({ status: 404 });
    });

    it('met à jour le produit et le renvoie', async () => {
        productsRepository.update.mockResolvedValue({ ...baseProduct, price: '12.00' });

        const product = await productsServices.updateProduct(1, { price: 12 });

        expect(productsRepository.update).toHaveBeenCalledWith(1, { price: 12 });
        expect(product.price).toBe('12.00');
    });
});

describe('productsServices.desactivateProduct / activateProduct', () => {
    it('lève une 404 à la désactivation si le produit est introuvable', async () => {
        productsRepository.desactivate.mockResolvedValue(null);

        await expect(productsServices.desactivateProduct(99)).rejects.toMatchObject({ status: 404 });
    });

    it('désactive le produit', async () => {
        productsRepository.desactivate.mockResolvedValue({ product_id: 1 });

        expect(await productsServices.desactivateProduct(1)).toEqual({ product_id: 1 });
    });

    it('lève une 404 à la réactivation si le produit est introuvable', async () => {
        productsRepository.activate.mockResolvedValue(null);

        await expect(productsServices.activateProduct(99)).rejects.toMatchObject({ status: 404 });
    });

    it('réactive le produit', async () => {
        productsRepository.activate.mockResolvedValue({ product_id: 1 });

        const product = await productsServices.activateProduct(1);

        expect(productsRepository.activate).toHaveBeenCalledWith(1);
        expect(product).toEqual({ product_id: 1 });
    });
});

describe('productsServices.deleteProduct', () => {
    it('lève une 404 si le produit est introuvable', async () => {
        productsRepository.findById.mockResolvedValue(null);

        await expect(productsServices.deleteProduct(99)).rejects.toMatchObject({ status: 404 });
        expect(productsRepository.countReferences).not.toHaveBeenCalled();
    });

    it('refuse (409) la suppression d\'un produit déjà ajouté à des interventions', async () => {
        productsRepository.findById.mockResolvedValue(baseProduct);
        productsRepository.countReferences.mockResolvedValue({ ajouterCount: 3 });

        await expect(productsServices.deleteProduct(1)).rejects.toMatchObject({ status: 409 });
        expect(productsRepository.remove).not.toHaveBeenCalled();
    });

    it('supprime un produit que rien ne référence', async () => {
        productsRepository.findById.mockResolvedValue(baseProduct);
        productsRepository.countReferences.mockResolvedValue({ ajouterCount: 0 });

        await productsServices.deleteProduct(1);

        expect(productsRepository.remove).toHaveBeenCalledWith(1);
    });
});