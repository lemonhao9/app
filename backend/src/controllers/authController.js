import {z} from 'zod';
import * as authService from '../services/authServices.js';
import { signupSchema } from '../utils/schemas.js';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export async function signup(req,res,next) {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({error: parsed.error.flatten()});
    }
    try{
        const {token, user} = await authService.signup(parsed.data);
        res.status(201).json({token, user});
    } catch (err) {
        next(err);
    }
};

export async function login(req,res,next) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({error: parsed.error.flatten()});
    }
    try{
        const {token, user} = await authService.login(parsed.data);
        res.status(200).json({token, user});
    } catch (err) {
        next(err);
    }
};

export async function logout(req,res) {
    res.json({message: 'Déconnexion réussie'});
};

export async function getCurrentUser(req,res,next) {
    try{
        const user = await authService.getUserById(req.user.userId);
        res.json({user});
    } catch (err) {
        next(err);
    }
};