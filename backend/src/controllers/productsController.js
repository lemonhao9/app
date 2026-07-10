import * as productsServices from '../services/productsServices.js';

export async function getAllActiveProducts(req, res, next) {
    try{
        const products = await productsServices.getAllActiveProducts();
        res.status(200).json(products);
    }catch(err){
        next(err);
    }
}