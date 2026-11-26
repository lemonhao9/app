import { query } from '../utils/db.js';

export async function findByZoneFeeDay(zoneId, feeId, day) {
    const result = await query(
        `WITH candidates AS (
            SELECT
                s.slot_id, s.start_at, s.ended_at,
                (
                    NOT EXISTS (
                        SELECT 1 FROM intervention i
                        WHERE i.slot_id = s.slot_id AND i.state != 'annulée'
                    )
                    AND (s.day + s.start_at) > NOW() + INTERVAL '2 hours'
                ) AS available,
                (
                    SELECT COUNT(*) FROM intervention i
                    JOIN slot s2 ON s2.slot_id = i.slot_id
                    WHERE s2.technician_id = s.technician_id AND s2.day = s.day AND i.state != 'annulée'
                ) AS day_load
            FROM slot s
            JOIN "user" t ON t.user_id = s.technician_id AND t.is_active = TRUE
            JOIN fee f ON f.fee_id = s.fee_id AND f.is_active = TRUE
            WHERE s.fee_id = $2 AND s.day = $3
              AND EXISTS (
                  SELECT 1 FROM positionner p
                  JOIN zone z ON z.zone_id = p.zone_id AND z.is_active = TRUE
                  WHERE p.zone_id = $1 AND p.user_id = s.technician_id
              )
        )
        SELECT DISTINCT ON (start_at, ended_at) slot_id, start_at, ended_at, available
        FROM candidates
        ORDER BY start_at, ended_at, available DESC, day_load, slot_id`,
        [zoneId, feeId, day]
    );
    return result.rows;
}

export async function findBookableInfo(slotId) {
    const result = await query(
        `SELECT
            s.slot_id, s.fee_id, s.technician_id, s.day, s.start_at,
            (
                t.is_active
                AND NOT EXISTS (
                    SELECT 1 FROM intervention i
                    WHERE i.slot_id = s.slot_id AND i.state != 'annulée'
                )
                AND (s.day + s.start_at) > NOW() + INTERVAL '2 hours'
            ) AS bookable
        FROM slot s
        JOIN "user" t ON t.user_id = s.technician_id
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

export async function create({ day, startAt, endedAt, feeId, technicianId }) {
    const result = await query(
        `INSERT INTO slot (day, start_at, ended_at, fee_id, technician_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING slot_id, day, start_at, ended_at, fee_id, technician_id`,
        [day, startAt, endedAt, feeId, technicianId]
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
