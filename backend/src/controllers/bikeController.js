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