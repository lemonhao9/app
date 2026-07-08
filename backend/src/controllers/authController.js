import {z} from 'zod';
import * as authService from '../services/authServices.js';
import { userSchema } from '../utils/schemas.js';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export async function signup(req,res) {
    const parsed = userSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({error: parsed.error.flatten()});
    }
    try{
        const {token, user} = await authService.signup(parsed.data);
        res.status(201).json({token, user});
    } catch (err) {
        res.status(err.status || 500).json({error: err.message});
    }
}

export async function login(req,res) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({error: parsed.error.flatten()});
    }
    try{
        const {token, user} = await authService.login(parsed.data);
        res.status(200).json({token, user});
    } catch (err) {
        res.status(err.status || 500).json({error: err.message});
    }
}

export async function logout(req,res) {
    res.json({message: 'Déconnexion réussie'});
}