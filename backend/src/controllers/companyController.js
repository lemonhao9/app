import * as companyService from '../services/companyService.js';

export async function getCompany(req, res, next) {
    try {
        const company = await companyService.getCompany();
        res.set('Cache-Control', 'public, max-age=300');
        res.json({ company });
    } catch (err) {
        next(err);
    }
}
