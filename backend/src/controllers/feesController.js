import * as feesServices from '../services/feesServices.js';

export async function getAllActiveFees(req, res) {
    try {
        const fees = await feesServices.getAllActiveFees();
        res.status(200).json(fees);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}