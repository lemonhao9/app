import  pool  from '../utils/db.js';

export async function create({addressName, city, postalCode, longitude, latitude, isDefault = false, userId}, runner = pool) {
    const results = await runner.query(
        `INSERT INTO address (address_name, city, postal_code, longitude, latitude, is_default, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING address_id, address_name, city, postal_code, longitude, latitude, is_default, zone_id, user_id`,
        [addressName, city, postalCode, longitude, latitude, isDefault, userId]
    );
    return results.rows[0];
}