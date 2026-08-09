import  pool  from '../utils/db.js';

export async function create({addressName, city, postalCode, longitude, latitude, isDefault = false, zoneId = null, userId}, runner = pool) {
    const results = await runner.query(
        `INSERT INTO address (address_name, city, postal_code, longitude, latitude, is_default, zone_id, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING address_id, address_name, city, postal_code, longitude, latitude, is_default, zone_id, user_id`,
        [addressName, city, postalCode, longitude, latitude, isDefault, zoneId, userId]
    );
    return results.rows[0];
}
export async function findByUserId(userId, runner = pool) {
    const results = await runner.query(
        `SELECT address_id, address_name, city, postal_code, longitude, latitude, is_default, zone_id, user_id
            FROM address WHERE user_id = $1 ORDER BY is_default DESC, address_id`,
        [userId]
    );
    return results.rows;
}