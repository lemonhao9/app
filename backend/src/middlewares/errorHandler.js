export function errorHandler(err, req, res, next) {
    console.error(err);
    const status = err.status || 500;
    const message = err.status ? err.message : "Une erreur interne est survenue";
    res.status(status).json({ error: message });
}