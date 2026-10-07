export function validateIdParam(req, res, next, value) {
    if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 2147483647) {
        return res.status(400).json({ error: 'Identifiant invalide' });
    }
    next();
}
