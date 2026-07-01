import {z} from 'zod';
import * as userService from '../services/userService.js';

const createTechnicianSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères minimum afin d\'être robuste'),
    name: z.string().min(1).max(255, 'Le nom ne doit pas dépasser 255 caractères'),
});

export async function createTechnician(req, res) {
    const parsed = createTechnicianSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({error: parsed.error.flatten()});
    }
    try {
        const user = await userService.createTechnician(parsed.data);
        res.status(201).json({user});
    } catch (err) {
        res.status(err.status || 500).json({error: err.message});
    }
}

export async function deleteAccount(req, res) {
    try{
        await userService.deleteAccount(req.user.userId);
        res.json({message: 'Compte supprimé avec succès'});
    } catch (err) {
        res.status(err.status || 500).json({error: err.message});
    }
}