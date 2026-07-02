import {query} from '../utils/db.js';

export async function findAllActive() {
    const result = await query(`
        SELECT * FROM additional_product WHERE is_active = TRUE ORDER BY category, name`,
        []
    );
    return result.rows;
}