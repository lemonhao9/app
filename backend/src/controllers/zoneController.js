import * as zoneService from '../services/zoneService.js';
import { zoneSchema } from '../utils/schemas.js';

export async function getAllZones(req, res, next) {
    try {
        const zones = await zoneService.getAllZones();
        res.json({zones});
    } catch (err) {
        next(err);
    }
}

export async function createZone(req, res, next) {
    const parsed = zoneSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
        const zone = await zoneService.createZone(parsed.data);
        res.status(201).json({ zone });
    } catch (err) {
        next(err);
    }
}

export async function updateZone(req, res, next) {
    const parsed = zoneSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
        const zone = await zoneService.updateZone(Number(req.params.id), parsed.data);
        res.json({ zone });
    } catch (err) {
        next(err);
    }
}

export async function desactivateZone(req, res, next) {
    try {
        await zoneService.desactivateZone(Number(req.params.id));
        res.json({ message: 'Zone désactivée avec succès' });
    } catch (err) {
        next(err);
    }
}