import * as addressService from '../services/addressService.js';
import * as zoneService from '../services/zoneService.js';
import { addressCreateSchema } from '../utils/schemas.js';

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

export async function getZoneForPoint(req, res, next) {
    const latitude = Number(req.query.lat);
    const longitude = Number(req.query.lng);
    const valid = Number.isFinite(latitude) && Number.isFinite(longitude)
        && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
    if (!valid) {
        return res.status(400).json({ error: 'Paramètres lat/lng invalides' });
    }
    try {
        const zoneId = await zoneService.findZoneForPoint(latitude, longitude);
        res.json({ zone_id: zoneId });
    } catch (err) {
        next(err);
    }
}

export async function getMyAddresses(req, res, next) {
    try {
        const addresses = await addressService.getMyAddresses(req.user.userId);
        res.json({addresses});
    } catch (err) {
        next(err);
    }
}

export async function createAddress(req, res, next) {
    const parsed = addressCreateSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
        const address = await addressService.createAddress(req.user.userId, parsed.data.label);
        res.status(201).json({ address });
    } catch (err) {
        next(err);
    }
}

export async function updateAddress(req, res, next) {
    const parsed = addressCreateSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
        const address = await addressService.updateAddress(req.user.userId, Number(req.params.id), parsed.data.label);
        res.json({ address });
    } catch (err) {
        next(err);
    }
}

export async function setDefaultAddress(req, res, next) {
    try {
        const address = await addressService.setDefaultAddress(req.user.userId, Number(req.params.id));
        res.json({ address });
    } catch (err) {
        next(err);
    }
}

export async function deleteAddress(req, res, next) {
    try {
        await addressService.deleteAddress(req.user.userId, Number(req.params.id));
        res.status(204).end();
    } catch (err) {
        next(err);
    }
}
