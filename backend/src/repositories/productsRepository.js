import {query} from '../utils/db.js';

export async function findAllActive() {
    const result = await query(`
        SELECT * FROM additional_product WHERE is_active = TRUE ORDER BY category, name`,
        []
    );
    return result.rows;
}

export async function findByIds(ids) {
    if (ids.length === 0) return [];
    const result = await query(
        `SELECT * FROM additional_product WHERE product_id = ANY($1::int[]) AND is_active = TRUE`,
        [ids]
    );
    return result.rows;
}
