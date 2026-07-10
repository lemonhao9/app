import * as addressService from '../services/addressService.js';

export async function geocode(req, res, next) {
    const { q } = req.query;
    if (!q || q.trim().length < 3) {
        return res.status(400).json({error : 'Paramètre requis (minimum 3 caractères)'});
    }
    try {
        const results = await addressService.geocode(q.trim());
        res.json(results);
    } catch (err) {
        next(err);
    }
}