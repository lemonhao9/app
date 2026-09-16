import pool from '../utils/db.js';

export async function create({ bikeId, slotId, technicianId, clientId, addressId, totalPrice }, runner = pool) {
    const result = await runner.query(
        `INSERT INTO intervention (bike_id, slot_id, technician_id, client_id, address_id, total_price)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING intervention_id, state, total_price, is_paid, bike_id, slot_id, technician_id, client_id, address_id`,
        [bikeId, slotId, technicianId, clientId, addressId, totalPrice]
    );
    return result.rows[0];
}

export async function addProduct(interventionId, productId, runner = pool) {
    await runner.query(
        `INSERT INTO ajouter (intervention_id, product_id) VALUES ($1, $2)`,
        [interventionId, productId]
    );
}

export async function addPhoto(interventionId, url, runner = pool) {
    const result = await runner.query(
        `INSERT INTO intervention_photo (intervention_id, url) VALUES ($1, $2)
         RETURNING photo_id, intervention_id, url, created_at`,
        [interventionId, url]
    );
    return result.rows[0];
}

export async function findById(interventionId, runner = pool) {
    const result = await runner.query(
        `SELECT intervention_id, state, total_price, is_paid, bike_id, slot_id, technician_id, client_id, address_id
            FROM intervention WHERE intervention_id = $1`,
        [interventionId]
    );
    return result.rows[0] ?? null;
}

export async function cancel(interventionId, runner = pool) {
    const result = await runner.query(
        `UPDATE intervention SET state = 'annulée' WHERE intervention_id = $1
         RETURNING intervention_id, state, total_price, is_paid, bike_id, slot_id, technician_id, client_id, address_id`,
        [interventionId]
    );
    return result.rows[0];
}

export async function updateState(interventionId, state, runner = pool) {
    const result = await runner.query(
        `UPDATE intervention SET state = $2 WHERE intervention_id = $1
         RETURNING intervention_id, state, total_price, is_paid, bike_id, slot_id, technician_id, client_id, address_id`,
        [interventionId, state]
    );
    return result.rows[0];
}

export async function complete(interventionId, { totalPrice, isPaid }, runner = pool) {
    const result = await runner.query(
        `UPDATE intervention SET state = 'terminée', total_price = $2, is_paid = $3 WHERE intervention_id = $1
         RETURNING intervention_id, state, total_price, is_paid, bike_id, slot_id, technician_id, client_id, address_id`,
        [interventionId, totalPrice, isPaid]
    );
    return result.rows[0];
}


export async function findByClientId(clientId, { sort, limit, offset }, runner = pool) {
    const dir = sort === 'asc' ? 'ASC' : 'DESC';
    const result = await runner.query(
        `SELECT
            i.intervention_id, i.state, i.total_price, i.is_paid,
            b.brand AS bike_brand, b.model AS bike_model, b.bike_type,
            f.name_fee, f.duration,
            s.day, s.start_at, s.ended_at,
            z.zone_id, z.name AS zone_name, z.color AS zone_color, z.geojson,
            t.name AS technician_name,
            a.address_name, a.city, a.latitude, a.longitude
        FROM intervention i
        LEFT JOIN bike b ON b.bike_id = i.bike_id
        JOIN slot s ON s.slot_id = i.slot_id
        JOIN zone z ON z.zone_id = s.zone_id
        JOIN fee f ON f.fee_id = s.fee_id
        LEFT JOIN "user" t ON t.user_id = i.technician_id
        JOIN address a ON a.address_id = i.address_id
        WHERE i.client_id = $1
        ORDER BY s.day ${dir}, s.start_at ${dir}
        LIMIT $2 OFFSET $3`,
        [clientId, limit + 1, offset]
    );
    return result.rows;
}

export async function findByTechnicianToday(technicianId, runner = pool) {
    const result = await runner.query(
        `SELECT
            i.intervention_id, i.state, i.total_price, i.is_paid,
            b.brand AS bike_brand, b.model AS bike_model, b.bike_type,
            f.name_fee, f.duration,
            s.day, s.start_at, s.ended_at,
            z.zone_id, z.name AS zone_name, z.color AS zone_color, z.geojson,
            a.address_name, a.city, a.latitude, a.longitude
        FROM intervention i
        LEFT JOIN bike b ON b.bike_id = i.bike_id
        JOIN slot s ON s.slot_id = i.slot_id
        JOIN zone z ON z.zone_id = s.zone_id
        JOIN fee f ON f.fee_id = s.fee_id
        JOIN address a ON a.address_id = i.address_id
        WHERE i.technician_id = $1 AND s.day = CURRENT_DATE AND i.state != 'annulée'
        ORDER BY s.start_at ASC`,
        [technicianId]
    );
    return result.rows;
}

export async function findDetailById(interventionId, runner = pool) {
    const result = await runner.query(
        `SELECT
            i.intervention_id, i.state, i.total_price, i.is_paid,
            b.brand AS bike_brand, b.model AS bike_model, b.bike_type, b.year AS bike_year, b.is_electric,
            f.name_fee, f.price_fee, f.duration,
            s.day, s.start_at, s.ended_at,
            z.zone_id, z.name AS zone_name,
            a.address_name, a.city, a.postal_code, a.latitude, a.longitude,
            c.name AS client_name, c.phone AS client_phone, c.email AS client_email
        FROM intervention i
        LEFT JOIN bike b ON b.bike_id = i.bike_id
        JOIN slot s ON s.slot_id = i.slot_id
        JOIN zone z ON z.zone_id = s.zone_id
        JOIN fee f ON f.fee_id = s.fee_id
        JOIN address a ON a.address_id = i.address_id
        JOIN "user" c ON c.user_id = i.client_id
        WHERE i.intervention_id = $1`,
        [interventionId]
    );
    return result.rows[0] ?? null;
}


export async function findProductsByInterventionId(interventionId, runner = pool) {
    const result = await runner.query(
        `SELECT ap.product_id, ap.name, ap.category, ap.price, aj.quantity
        FROM ajouter aj
        JOIN additional_product ap ON ap.product_id = aj.product_id
        WHERE aj.intervention_id = $1
        ORDER BY ap.category, ap.name`,
        [interventionId]
    );
    return result.rows;
}

export async function findPhotosByInterventionId(interventionId, runner = pool) {
    const result = await runner.query(
        `SELECT photo_id, url, created_at
        FROM intervention_photo
        WHERE intervention_id = $1
        ORDER BY created_at ASC`,
        [interventionId]
    );
    return result.rows;
}

export async function findByTechnicianId(technicianId, { date, zoneId, clientId, sort, limit, offset }, runner = pool) {
    const dir = sort === 'asc' ? 'ASC' : 'DESC';
    const conditions = ['i.technician_id = $1', 's.day < CURRENT_DATE'];
    const params = [technicianId];

    if (date) {
        params.push(date);
        conditions.push(`s.day = $${params.length}`);
    }
    if (zoneId) {
        params.push(zoneId);
        conditions.push(`z.zone_id = $${params.length}`);
    }
    if (clientId) {
        params.push(clientId);
        conditions.push(`i.client_id = $${params.length}`);
    }

    params.push(limit + 1, offset);
    const result = await runner.query(
        `SELECT
            i.intervention_id, i.state, i.total_price, i.is_paid,
            b.brand AS bike_brand, b.model AS bike_model, b.bike_type,
            f.name_fee, f.duration,
            s.day, s.start_at, s.ended_at,
            z.zone_id, z.name AS zone_name,
            c.user_id AS client_id, c.name AS client_name,
            a.address_name, a.city
        FROM intervention i
        LEFT JOIN bike b ON b.bike_id = i.bike_id
        JOIN slot s ON s.slot_id = i.slot_id
        JOIN zone z ON z.zone_id = s.zone_id
        JOIN fee f ON f.fee_id = s.fee_id
        JOIN address a ON a.address_id = i.address_id
        JOIN "user" c ON c.user_id = i.client_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY s.day ${dir}, s.start_at ${dir}
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
    );
    return result.rows;
}
