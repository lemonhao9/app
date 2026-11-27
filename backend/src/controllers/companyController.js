import * as companyService from '../services/companyService.js';
import { companyUpdateSchema } from '../utils/schemas.js';
import { sendValidationError } from '../utils/validation.js';

export async function getCompany(req, res, next) {
    try {
        const company = await companyService.getCompany();
        res.set('Cache-Control', 'public, max-age=300');
        res.json({ company });
    } catch (err) {
        next(err);
    }
}

export async function updateCompany(req, res, next) {
    const parsed = companyUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        return sendValidationError(res, parsed.error);
    }
    try {
        const company = await companyService.updateCompany(parsed.data);
        res.set('Cache-Control', 'no-store');
        res.json({ company });
    } catch (err) {
        next(err);
    }
}
