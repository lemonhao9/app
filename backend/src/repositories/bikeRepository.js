import pool from '../utils/db.js';

export async function findByUserId(userId, runner = pool) {
    const results = await runner.query(
        `SELECT bike_id, brand, model, year, bike_type, is_electric, user_id
            FROM bike WHERE user_id = $1 ORDER BY bike_id`,
        [userId]
    );
    return results.rows;
}

export async function create({ brand, model, year, bike_type, is_electric, photo, userId }, runner = pool) {
    const results = await runner.query(
        `INSERT INTO bike (brand, model, year, bike_type, is_electric, photo, user_id)
        VALUES($1, $2, $3, $4, $5, $6, $7)
        RETURNING bike_id, brand, model, year, bike_type, is_electric, photo, user_id`,
    [brand ?? null, model ?? null, year ?? null, bike_type ?? null, is_electric ?? false, photo ?? null, userId]
    );
    return results.rows[0];
}