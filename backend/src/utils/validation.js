import { z } from 'zod';

export function sendValidationError(res, error) {
    return res.status(400).json({ error: z.flattenError(error) });
}