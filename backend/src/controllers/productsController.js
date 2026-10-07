import * as productsServices from '../services/productsServices.js';
import { productSchema } from '../utils/schemas.js';

export async function getAllActiveProducts(req, res, next) {
    try{
        const products = await productsServices.getAllActiveProducts();
        res.status(200).json(products);
    }catch(err){
        next(err);
    }
}

export async function getAllProducts(req, res, next) {
    try {
        const products = await productsServices.getAllProducts();
        res.json({ products });
    } catch (err) {
        next(err);
    }
}

export async function createProduct(req, res, next) {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
        const product = await productsServices.createProduct(parsed.data);
        res.status(201).json({ product });
    } catch (err) {
        next(err);
    }
}

export async function updateProduct(req, res, next) {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
        const product = await productsServices.updateProduct(Number(req.params.id), parsed.data);
        res.json({ product });
    } catch (err) {
        next(err);
    }
}

export async function desactivateProduct(req, res, next) {
    try {
        await productsServices.desactivateProduct(Number(req.params.id));
        res.json({ message: 'Produit désactivé avec succès' });
    } catch (err) {
        next(err);
    }
}

export async function deleteProduct(req, res, next) {
    try {
        await productsServices.deleteProduct(Number(req.params.id));
        res.json({ message: 'Produit supprimé définitivement' });
    } catch (err) {
        next(err);
    }
}
