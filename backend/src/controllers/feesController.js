import * as feesServices from '../services/feesServices.js';

export async function getAllActiveFees(req, res, next) {
    try {
        const fees = await feesServices.getAllActiveFees();
        res.status(200).json(fees);
    } catch (err) {
        next(err);
    }
}