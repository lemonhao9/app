import { getClient } from '../utils/db.js';
import { BOOKING_HORIZON_DAYS } from '../utils/booking.js';
import { todayInTimezone, addDays, weekdayOf, decideDay } from '../utils/slotPlanning.js';

const WORK_START_HOUR = Number(process.env.SLOT_WORK_START_HOUR ?? 9);
const WORK_END_HOUR = Number(process.env.SLOT_WORK_END_HOUR ?? 18);
const WORKING_WEEKDAYS = [1, 2, 3, 4, 5, 6];
const WINDOW = { startMinutes: WORK_START_HOUR * 60, endMinutes: WORK_END_HOUR * 60 };
const LOCK_KEY = 'homecycl:generate-slots';

async function getActiveFees(client) {
    const result = await client.query('SELECT fee_id, duration FROM fee WHERE is_active = TRUE ORDER BY fee_id');
    return result.rows;
}

async function getBookableTechnicians(client) {
    const result = await client.query(`
        SELECT u.user_id AS technician_id
        FROM "user" u
        WHERE u.role = 'technician' AND u.is_active = TRUE
          AND EXISTS (
              SELECT 1 FROM positionner p
              JOIN zone z ON z.zone_id = p.zone_id AND z.is_active = TRUE
              WHERE p.user_id = u.user_id
          )
        ORDER BY u.user_id
    `);
    return result.rows;
}

async function getDaySlots(client, technicianId, day) {
    const result = await client.query(
        `SELECT s.slot_id, s.start_at, s.ended_at, s.fee_id,
                EXISTS (SELECT 1 FROM intervention i WHERE i.slot_id = s.slot_id) AS locked
         FROM slot s
         WHERE s.technician_id = $1 AND s.day = $2
         ORDER BY s.start_at`,
        [technicianId, day]
    );
    return result.rows;
}

async function insertSlots(client, technicianId, day, plan) {
    for (const slot of plan) {
        await client.query(
            `INSERT INTO slot (start_at, ended_at, day, fee_id, technician_id) VALUES ($1, $2, $3, $4, $5)`,
            [slot.start_at, slot.ended_at, day, slot.fee_id, technicianId]
        );
    }
}

async function replaceFreeSlots(client, technicianId, day, plan) {
    await client.query('BEGIN');
    try {
        const deleted = await client.query(
            `DELETE FROM slot s
             WHERE s.technician_id = $1 AND s.day = $2
               AND NOT EXISTS (SELECT 1 FROM intervention i WHERE i.slot_id = s.slot_id)`,
            [technicianId, day]
        );
        await insertSlots(client, technicianId, day, plan);
        await client.query('COMMIT');
        return deleted.rowCount;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
}

async function generate(client) {
    const summary = { created: 0, deleted: 0, days: 0 };

    const fees = await getActiveFees(client);
    if (fees.length === 0) return summary;

    const technicians = await getBookableTechnicians(client);
    const today = todayInTimezone();

    for (const { technician_id } of technicians) {
        for (let i = 0; i < BOOKING_HORIZON_DAYS; i++) {
            const day = addDays(today, i);
            if (!WORKING_WEEKDAYS.includes(weekdayOf(day))) continue;

            const existing = await getDaySlots(client, technician_id, day);
            if (day === today && existing.length > 0) continue;

            const { action, plan } = decideDay(existing, fees, WINDOW);
            if (action === 'create') {
                await insertSlots(client, technician_id, day, plan);
                summary.created += plan.length;
                summary.days++;
            } else if (action === 'replace') {
                summary.deleted += await replaceFreeSlots(client, technician_id, day, plan);
                summary.created += plan.length;
                summary.days++;
            } else if (action === 'fill') {
                await insertSlots(client, technician_id, day, plan);
                summary.created += plan.length;
                summary.days++;
            }
        }
    }
    return summary;
}

export async function syncSlots() {
    const client = await getClient();
    try {
        await client.query('SELECT pg_advisory_lock(hashtext($1))', [LOCK_KEY]);
        try {
            return await generate(client);
        } finally {
            await client.query('SELECT pg_advisory_unlock(hashtext($1))', [LOCK_KEY]);
        }
    } finally {
        client.release();
    }
}

export function syncSlotsInBackground(reason) {
    syncSlots()
        .then(({ created, deleted, days }) => {
            if (days > 0) console.log(`Créneaux resynchronisés (${reason}) : ${days} jour(s), ${created} créé(s), ${deleted} supprimé(s)`);
        })
        .catch((err) => console.error(`Échec de la resynchronisation des créneaux (${reason}) :`, err));
}