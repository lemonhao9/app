import * as bikeService from '../services/bikeService.js';
import { bikeSchema } from '../utils/schemas.js';

export async function getMyBikes(req, res, next) {
    try {
        const bikes = await bikeService.getMyBikes(req.user.userId);
        res.json({bikes});
    } catch (err) {
        next(err);
    }
}

export async function createBike(req, res, next) {
    const parsed = bikeSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({error: parsed.error.flatten()});
    }
    try{
        const photo = req.file ? `/uploads/${req.file.filename}` : null;
        const bike = await bikeService.addBike(req.user.userId, {...parsed.data, photo});
        res.status(201).json({bike});
    } catch (err) {
        next(err);
    }
}

export async function updateBike(req, res, next) {
    const parsed = bikeSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({error: parsed.error.flatten()});
    }
    try {
        const photo = req.file ? `/uploads/${req.file.filename}` : undefined;
        const bike = await bikeService.updateBike(req.user.userId, Number(req.params.id), {...parsed.data, photo});
        res.json({bike});
    } catch (err) {
        next(err);
    }
}

export async function deleteBike(req, res, next) {
    try {
        await bikeService.deleteBike(req.user.userId, Number(req.params.id));
        res.json({message: 'Vélo supprimé avec succès'});
    } catch (err) {
        next(err);
    }
}