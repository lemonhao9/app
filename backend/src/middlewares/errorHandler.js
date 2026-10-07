export function errorHandler(err, req, res, next) {
    console.error(err);
    const status = err.status || 500;
    const message = err.status ? err.message : "Une erreur interne est survenue";
    const body = { error: message };
    if (err.status && err.appCode) body.code = err.appCode;
    res.status(status).json(body);
}