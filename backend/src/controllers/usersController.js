import {z} from 'zod';
import * as userService from '../services/userService.js';
import { userSchema } from '../utils/schemas.js';

export async function createTechnician(req, res, next) {
    const parsed = userSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({error: parsed.error.flatten()});
    }
    try {
        const user = await userService.createTechnician(parsed.data);
        res.status(201).json({user});
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