import * as zoneService from '../services/zoneService.js';
import { zoneSchema, assignTechnicianSchema } from '../utils/schemas.js';

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

export async function getZoneTechnicians(req, res, next) {
    try {
        const technicians = await zoneService.getZoneTechnicians(Number(req.params.id));
        res.json({ technicians });
    } catch (err) {
        next(err);
    }
}

export async function assignTechnician(req, res, next) {
    const parsed = assignTechnicianSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
        await zoneService.assignTechnician(Number(req.params.id), parsed.data.userId);
        res.json({ message: 'Technicien assigné avec succès' });
    } catch (err) {
        next(err);
    }
}

export async function unassignTechnician(req, res, next) {
    try {
        await zoneService.unassignTechnician(Number(req.params.id), Number(req.params.user_id));
        res.json({ message: 'Technicien désassigné avec succès' });
    } catch (err) {
        next(err);
    }
}
