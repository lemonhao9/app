import pool,{query} from '../utils/db.js';

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

export async function findAll() {
    const result = await query(`SELECT * FROM fee ORDER BY price_fee`, []);
    return result.rows;
}

export async function create({ name_fee, price_fee, duration, description_forfait, optional_title, optional_price, optional_desc }, runner = pool) {
    const result = await runner.query(
        `INSERT INTO fee (name_fee, price_fee, duration, description_forfait, optional_title, optional_price, optional_desc)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [name_fee, price_fee, duration, description_forfait ?? null, optional_title ?? null, optional_price ?? null, optional_desc ?? null]
    );
    return result.rows[0];
}

export async function update(feeId, { name_fee, price_fee, duration, description_forfait, optional_title, optional_price, optional_desc }, runner = pool) {
    const result = await runner.query(
        `UPDATE fee SET name_fee=$2, price_fee=$3, duration=$4, description_forfait=$5, optional_title=$6, optional_price=$7, optional_desc=$8
         WHERE fee_id = $1 RETURNING *`,
        [feeId, name_fee, price_fee, duration, description_forfait ?? null, optional_title ?? null, optional_price ?? null, optional_desc ?? null]
    );
    return result.rows[0];
}

export async function desactivate(feeId, runner = pool) {
    const result = await runner.query(
        `UPDATE fee SET is_active = false WHERE fee_id = $1 RETURNING fee_id`,
        [feeId]
    );
    return result.rows[0] ?? null;
}

export async function countReferences(feeId) {
    const result = await query(
        `SELECT (SELECT COUNT(*) FROM slot WHERE fee_id = $1) AS slot_count`,
        [feeId]
    );
    return { slotCount: Number(result.rows[0].slot_count) };
}

export async function remove(feeId, runner = pool) {
    const result = await runner.query(
        `DELETE FROM fee WHERE fee_id = $1 RETURNING fee_id`,
        [feeId]
    );
    return result.rows[0] ?? null;
}
