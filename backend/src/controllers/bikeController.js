import * as bikeService from '../services/bikeService.js';

export async function getMyBikes(req, res, next) {
    try {
        const bikes = await bikeService.getMyBikes(req.user.userId);
        res.json({bikes});
    } catch (err) {
        next(err);
    }
}