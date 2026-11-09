import {z} from 'zod';
import * as userService from '../services/userService.js';
import { technicianCreateSchema, userUpdateSchema } from '../utils/schemas.js';

export async function createTechnician(req, res, next) {
    const parsed = technicianCreateSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({error: parsed.error.flatten()});
    }
    try {
        const { user, temporaryPassword } = await userService.createTechnician(parsed.data);
        res.set('Cache-Control', 'no-store');
        res.status(201).json({ user, temporaryPassword });
    } catch (err) {
        next(err);
    }
}

export async function regenerateTemporaryPassword(req, res, next) {
    try {
        const { user, temporaryPassword } = await userService.regenerateTemporaryPassword(Number(req.params.id));
        res.set('Cache-Control', 'no-store');
        res.json({ user, temporaryPassword });
    } catch (err) {
        next(err);
    }
}

export async function deleteAccount(req, res, next) {
    try{
        await userService.deleteAccount(req.user.userId);
        res.json({message: 'Compte supprimé avec succès'});
    } catch (err) {
        next(err);
    }
}

export async function updateProfile(req, res, next) {
    const parsed = userUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({error: parsed.error.flatten()});
    }
    try {
        const picture = req.file ? `/uploads/${req.file.filename}` : undefined;
        const user = await userService.updateProfile(req.user.userId, {...parsed.data, picture});
        res.json({user});
    } catch (err) {
        next(err);
    }
}

const roleQuerySchema = z.object({ role: z.enum(['client', 'technician']).optional() });
export async function listUsers(req, res, next) {
    const parsed = roleQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({error: parsed.error.flatten()});
    }
    try {
        const users = await userService.listUsers(parsed.data.role);
        res.json({users});
    } catch (err) {
        next(err);
    }
}


export async function listUserBikes(req, res, next) {
    try {
        const bikes = await userService.listUserBikes(Number(req.params.id));
        res.json({ bikes });
    } catch (err) {
        next(err);
    }
}
