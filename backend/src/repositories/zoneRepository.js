import pool, { query } from '../utils/db.js';

export async function findAll() {
    const result = await query('SELECT * FROM zone ORDER BY zone_id', []);
    return result.rows;
}

export async function findById(zoneId) {
    const result = await query('SELECT * FROM zone WHERE zone_id = $1', [zoneId]);
    return result.rows[0] ?? null;
}

export async function create({ name, color, latitude, longitude, geojson }, runner = pool) {
    const results = await runner.query(
        `INSERT INTO zone (name, color, latitude, longitude, geojson) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [name, color ?? null, latitude ?? null, longitude ?? null, geojson]
    );
    return results.rows[0];
}

export async function update(zoneId, { name, color, latitude, longitude, geojson }, runner = pool) {
    const results = await runner.query(
        `UPDATE zone SET name = $1, color = $2, latitude = $3, longitude = $4, geojson = $5 WHERE zone_id = $6 RETURNING *`,
        [name, color ?? null, latitude ?? null, longitude ?? null, geojson, zoneId]
    );
    return results.rows[0];
}

export async function desactivate(zoneId, runner = pool) {
    const results = await runner.query(
        `UPDATE zone SET is_active = false WHERE zone_id = $1 RETURNING zone_id`,
        [zoneId]
    );
    return results.rows[0] ?? null;
}