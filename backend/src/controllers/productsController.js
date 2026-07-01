import * as productsServices from '../services/productsServices.js';

export async function getAllActiveProducts(req, res) {
    try{
        const products = await productsServices.getAllActiveProducts();
        res.status(200).json(products);
    }catch(err){
        res.status(500).json({ error: err.message });
    }
}