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

export async function findById(addressId, runner = pool) {
    const results = await runner.query(
        `SELECT address_id, address_name, city, postal_code, longitude, latitude, is_default, zone_id, user_id
            FROM address WHERE address_id = $1`,
        [addressId]
    );
    return results.rows[0] ?? null;
}

export async function lockByUserId(userId, runner = pool) {
    const results = await runner.query(
        `SELECT address_id FROM address WHERE user_id = $1 FOR UPDATE`,
        [userId]
    );
    return results.rows;
}

export async function update(addressId, { addressName, city, postalCode, longitude, latitude, zoneId }, runner = pool) {
    const results = await runner.query(
        `UPDATE address
         SET address_name = $2, city = $3, postal_code = $4, longitude = $5, latitude = $6, zone_id = $7
         WHERE address_id = $1
         RETURNING address_id, address_name, city, postal_code, longitude, latitude, is_default, zone_id, user_id`,
        [addressId, addressName, city, postalCode, longitude, latitude, zoneId]
    );
    return results.rows[0];
}

export async function remove(addressId, runner = pool) {
    await runner.query(`DELETE FROM address WHERE address_id = $1`, [addressId]);
}

export async function clearDefault(userId, runner = pool) {
    await runner.query(`UPDATE address SET is_default = FALSE WHERE user_id = $1 AND is_default`, [userId]);
}

export async function setDefault(addressId, runner = pool) {
    const results = await runner.query(
        `UPDATE address SET is_default = TRUE WHERE address_id = $1
         RETURNING address_id, address_name, city, postal_code, longitude, latitude, is_default, zone_id, user_id`,
        [addressId]
    );
    return results.rows[0];
}

export async function promoteOldestAsDefault(userId, runner = pool) {
    await runner.query(
        `UPDATE address SET is_default = TRUE
         WHERE address_id = (SELECT address_id FROM address WHERE user_id = $1 ORDER BY address_id LIMIT 1)`,
        [userId]
    );
}
