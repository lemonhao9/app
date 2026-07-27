import pool from '../utils/db.js';

export async function findByUserId(userId, runner = pool) {
    const results = await runner.query(
        `SELECT bike_id, brand, model, year, bike_type, is_electric, photo, user_id
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

export async function update({bikeId, brand, model, year, bike_type, is_electric, photo}, runner = pool) {
    const results = await runner.query(
        `UPDATE bike SET brand = $1, model = $2, year = $3, bike_type = $4, is_electric = $5, photo = $6
        WHERE bike_id = $7
        RETURNING bike_id, brand, model, year, bike_type, is_electric, photo, user_id`,
        [brand ?? null, model ?? null, year ?? null, bike_type ?? null, is_electric ?? false, photo ?? null, bikeId]
    );
    return results.rows[0];
}

export async function findById(bikeId, runner = pool) {
    const results = await runner.query(
        `SELECT bike_id, brand, model, year, bike_type, is_electric, photo, user_id
            FROM bike WHERE bike_id = $1`,
        [bikeId]
    );
    return results.rows[0] ?? null;
}

export async function remove(bikeId, runner = pool) {
    const results = await runner.query(
        `DELETE FROM bike WHERE bike_id = $1 RETURNING bike_id, photo`,
        [bikeId]
    );
    return results.rows[0] ?? null;
}