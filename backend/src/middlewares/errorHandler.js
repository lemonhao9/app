export function errorHandler(err, req, res, next) {
    console.error(err);
    if (err.name === 'MulterError') {
        const tooLarge = err.code === 'LIMIT_FILE_SIZE';
        return res.status(tooLarge ? 413 : 400).json({
            error: tooLarge ? 'Fichier trop volumineux (5 Mo maximum)' : 'Envoi de fichiers refusé (6 photos maximum par envoi)',
        });
    }
    const status = err.status || 500;
    const message = err.status ? err.message : "Une erreur interne est survenue";
    const body = { error: message };
    if (err.status && err.appCode) body.code = err.appCode;
    res.status(status).json(body);
}
