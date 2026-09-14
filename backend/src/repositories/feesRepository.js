import {query} from '../utils/db.js';

export async function findAllActive() {
    const result = await query(`
        SELECT * FROM fee WHERE is_active = TRUE ORDER BY price_fee`,
        []
    );
    return result.rows;
}

export async function findById(feeId) {
    const result = await query(`SELECT * FROM fee WHERE fee_id = $1`, [feeId]);
    return result.rows[0] ?? null;
}
