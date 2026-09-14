import { createInterventionSchema } from '../utils/schemas.js';
import * as interventionService from '../services/interventionService.js';
import { z } from 'zod';

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
        const photos = await interventionService.addPhotos(req.user.userId, Number(req.params.id), req.files ?? []);
        res.status(201).json({ photos });
    } catch (err) {
        next(err);
    }
}

export async function cancelIntervention(req, res, next) {
    try {
        const intervention = await interventionService.cancelIntervention(req.user.userId, Number(req.params.id));
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
