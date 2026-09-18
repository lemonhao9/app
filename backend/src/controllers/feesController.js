import * as feesServices from '../services/feesServices.js';
import { feeSchema } from '../utils/schemas.js';

export async function getAllActiveFees(req, res, next) {
    try {
        const fees = await feesServices.getAllActiveFees();
        res.status(200).json(fees);
    } catch (err) {
        next(err);
    }
}

export async function getAllFees(req, res, next) {
    try {
        const fees = await feesServices.getAllFees();
        res.json({ fees });
    } catch (err) {
        next(err);
    }
}

export async function createFee(req, res, next) {
    const parsed = feeSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
        const fee = await feesServices.createFee(parsed.data);
        res.status(201).json({ fee });
    } catch (err) {
        next(err);
    }
}

export async function updateFee(req, res, next) {
    const parsed = feeSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
        const fee = await feesServices.updateFee(Number(req.params.id), parsed.data);
        res.json({ fee });
    } catch (err) {
        next(err);
    }
}

export async function desactivateFee(req, res, next) {
    try {
        await feesServices.desactivateFee(Number(req.params.id));
        res.json({ message: 'Forfait désactivé avec succès' });
    } catch (err) {
        next(err);
    }
}

export async function deleteFee(req, res, next) {
    try {
        await feesServices.deleteFee(Number(req.params.id));
        res.json({ message: 'Forfait supprimé définitivement' });
    } catch (err) {
        next(err);
    }
}
