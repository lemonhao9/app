import { z } from 'zod';
import * as slotService from '../services/slotService.js';

const slotQuerySchema = z.object({
    zone_id: z.coerce.number().int().positive(),
    fee_id: z.coerce.number().int().positive(),
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function getSlots(req, res, next) {
    const parsed = slotQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
        const slots = await slotService.getAvailableSlots(parsed.data);
        res.json({ slots });
    } catch (err) {
        next(err);
    }
}

const createSlotSchema = z.object({
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    start_at: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
    ended_at: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
    zone_id: z.coerce.number().int().positive(),
    fee_id: z.coerce.number().int().positive(),
    technician_id: z.coerce.number().int().positive(),
});

export async function createSlot(req, res, next) {
    const parsed = createSlotSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
        const slot = await slotService.createSlot(parsed.data);
        res.status(201).json({ slot });
    } catch (err) {
        next(err);
    }
}

export async function deleteSlot(req, res, next) {
    try {
        await slotService.deleteSlot(Number(req.params.id));
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}
