import * as interventionService from '../services/interventionService.js';
import { z } from 'zod';
import { createInterventionSchema, completeInterventionSchema, technicianHistoryQuerySchema, adminInterventionsQuerySchema } from '../utils/schemas.js';

export async function createIntervention(req, res, next) {
    const parsed = createInterventionSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
        const intervention = await interventionService.createIntervention(req.user.userId, parsed.data);
        res.status(201).json({ intervention });
    } catch (err) {
        next(err);
    }
}

export async function addPhotos(req, res, next) {
    try {
        const photos = await interventionService.addPhotos(req.user.userId, req.user.role, Number(req.params.id), req.files ?? []);
        res.status(201).json({ photos });
    } catch (err) {
        next(err);
    }
}

export async function cancelIntervention(req, res, next) {
    try {
        const intervention = await interventionService.cancelIntervention(req.user.userId, req.user.role, Number(req.params.id));
        res.json({ intervention });
    } catch (err) {
        next(err);
    }
}

const myInterventionsQuerySchema = z.object({
    sort: z.enum(['asc', 'desc']).default('desc'),
    limit: z.coerce.number().int().positive().max(50).default(6),
    offset: z.coerce.number().int().nonnegative().default(0),
});

export async function getMyInterventions(req, res, next) {
    const parsed = myInterventionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
        const result = await interventionService.getMyInterventions(req.user.userId, parsed.data);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

export async function getTodayForTechnician(req, res, next) {
    try {
        const interventions = await interventionService.getTodayForTechnician(req.user.userId);
        res.json({ interventions });
    } catch (err) {
        next(err);
    }
}

export async function getInterventionDetail(req, res, next) {
    try {
        const intervention = await interventionService.getInterventionDetail(req.user.userId, req.user.role, Number(req.params.id));
        res.json({ intervention });
    } catch (err) {
        next(err);
    }
}

export async function startIntervention(req, res, next) {
    try {
        const intervention = await interventionService.startIntervention(req.user.userId, Number(req.params.id));
        res.json({ intervention });
    } catch (err) {
        next(err);
    }
}

export async function completeIntervention(req, res, next) {
    const parsed = completeInterventionSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
        const intervention = await interventionService.completeIntervention(req.user.userId, Number(req.params.id), parsed.data);
        res.json({ intervention });
    } catch (err) {
        next(err);
    }
}

export async function getHistoryForTechnician(req, res, next) {
    const parsed = technicianHistoryQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
        const result = await interventionService.getHistoryForTechnician(req.user.userId, parsed.data);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

export async function getAllInterventions(req, res, next) {
    const parsed = adminInterventionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
        const result = await interventionService.getAllInterventions(parsed.data);
        res.json(result);
    } catch (err) {
        next(err);
    }
}
