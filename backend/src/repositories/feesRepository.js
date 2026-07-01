import {query} from '../utils/db.js';

export async function findAllActive() {
    const result = await query(`
        SELECT * FROM fee WHERE is_active = TRUE ORDER BY price_fee`,
        []
    );
    return result.rows;
}