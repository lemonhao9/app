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

export async function countReferences(zoneId) {
    const result = await query(
        `SELECT
            (SELECT COUNT(*) FROM address WHERE zone_id = $1) AS address_count,
            (SELECT COUNT(*) FROM slot WHERE zone_id = $1) AS slot_count`,
        [zoneId]
    );
    return {
        addressCount: Number(result.rows[0].address_count),
        slotCount: Number(result.rows[0].slot_count),
    };
}

export async function remove(zoneId, runner = pool) {
    const results = await runner.query(
        `DELETE FROM zone WHERE zone_id = $1 RETURNING zone_id`,
        [zoneId]
    );
    return results.rows[0] ?? null;
}

export async function assignTechnician(zoneId, userId, runner = pool) {
    await runner.query(
        `INSERT INTO positionner (zone_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [zoneId, userId]
    );
}

export async function unassignTechnician(zoneId, userId, runner = pool) {
    await runner.query(
        `DELETE FROM positionner WHERE zone_id = $1 AND user_id = $2`,
        [zoneId, userId]
    );
}


export async function findZoneForPoint(latitude, longitude) {
    const result = await query(
        `SELECT zone_id FROM zone
         WHERE is_active = true
           AND ST_Contains(
             ST_SetSRID(ST_GeomFromGeoJSON(geojson->'geometry'), 4326),
             ST_SetSRID(ST_MakePoint($1, $2), 4326)
           )
         LIMIT 1`,
        [longitude, latitude]
    );
    return result.rows[0]?.zone_id ?? null;
}

export async function findTechniciansByZone(zoneId) {
    const result = await query(
        `SELECT u.user_id, u.name, u.email FROM positionner p JOIN "user" u ON u.user_id = p.user_id WHERE p.zone_id = $1`,
        [zoneId]
    );
    return result.rows;
}