import { query } from '../utils/db.js';

export async function findByZoneFeeDay(zoneId, feeId, day) {
    const result = await query(
        `SELECT
            s.slot_id, s.start_at, s.ended_at,
            (
                NOT EXISTS (
                    SELECT 1 FROM intervention i
                    WHERE i.slot_id = s.slot_id AND i.state != 'annulée'
                )
                AND (s.day + s.start_at) > NOW() + INTERVAL '2 hours'
            ) AS available
        FROM slot s
        WHERE s.zone_id = $1 AND s.fee_id = $2 AND s.day = $3
        ORDER BY s.start_at`,
        [zoneId, feeId, day]
    );
    return result.rows;
}

export async function findBookableInfo(slotId) {
    const result = await query(
        `SELECT
            s.slot_id, s.zone_id, s.fee_id, s.technician_id, s.day, s.start_at,
            (
                NOT EXISTS (
                    SELECT 1 FROM intervention i
                    WHERE i.slot_id = s.slot_id AND i.state != 'annulée'
                )
                AND (s.day + s.start_at) > NOW() + INTERVAL '2 hours'
            ) AS bookable
        FROM slot s
        WHERE s.slot_id = $1`,
        [slotId]
    );
    return result.rows[0] ?? null;
}

export async function findById(slotId) {
    const result = await query(`SELECT * FROM slot WHERE slot_id = $1`, [slotId]);
    return result.rows[0] ?? null;
}

export async function findOverlapping(technicianId, day, startAt, endedAt) {
    const result = await query(
        `SELECT 1 FROM slot
         WHERE technician_id = $1 AND day = $2
           AND start_at < $4 AND ended_at > $3
         LIMIT 1`,
        [technicianId, day, startAt, endedAt]
    );
    return result.rows.length > 0;
}

export async function create({ day, startAt, endedAt, zoneId, feeId, technicianId }) {
    const result = await query(
        `INSERT INTO slot (day, start_at, ended_at, zone_id, fee_id, technician_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING slot_id, day, start_at, ended_at, zone_id, fee_id, technician_id`,
        [day, startAt, endedAt, zoneId, feeId, technicianId]
    );
    return result.rows[0];
}

export async function countInterventions(slotId) {
    const result = await query(`SELECT COUNT(*) FROM intervention WHERE slot_id = $1`, [slotId]);
    return Number(result.rows[0].count);
}

export async function remove(slotId) {
    const result = await query(`DELETE FROM slot WHERE slot_id = $1 RETURNING slot_id`, [slotId]);
    return result.rows[0] ?? null;
}
