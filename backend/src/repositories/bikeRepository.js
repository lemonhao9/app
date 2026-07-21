import pool from '../utils/db.js';

export async function findByUserId(userId, runner = pool) {
    const results = await runner.query(
        `SELECT bike_id, brand, model, year, bike_type, is_electric, user_id
            FROM bike WHERE user_id = $1 ORDER BY bike_id`,
        [userId]
    );
    return results.rows;
}