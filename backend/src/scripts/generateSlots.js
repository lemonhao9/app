import 'dotenv/config';
import { query } from '../utils/db.js';

// Génération automatique récurrente des créneaux (SLOT-01, ADR-13).
// Idempotent : saute les jours déjà générés pour un technicien donné.
// Pour un même technicien/jour, les forfaits s'enchaînent séquentiellement
// (jamais deux forfaits sur le même horaire)

const DAYS_AHEAD = Number(process.env.SLOT_GENERATION_DAYS_AHEAD ?? 14);
const WORK_START_HOUR = Number(process.env.SLOT_WORK_START_HOUR ?? 9);
const WORK_END_HOUR = Number(process.env.SLOT_WORK_END_HOUR ?? 18);
const WORKING_WEEKDAYS = [1, 2, 3, 4, 5, 6]; // lundi-samedi (0 = dimanche)

function addMinutes(hour, minute, delta) {
    const total = hour * 60 + minute + delta;
    return { hour: Math.floor(total / 60), minute: total % 60 };
}

function toTimeString({ hour, minute }) {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}

function toDateString(date) {
    return date.toISOString().slice(0, 10);
}

async function getActiveFees() {
    const result = await query('SELECT fee_id, duration FROM fee WHERE is_active = TRUE ORDER BY fee_id', []);
    return result.rows;
}

async function getTechnicianZoneAssignments() {
    const result = await query(`
        SELECT p.zone_id, p.user_id AS technician_id
        FROM positionner p
        JOIN zone z ON z.zone_id = p.zone_id AND z.is_active = TRUE
        JOIN "user" u ON u.user_id = p.user_id AND u.is_active = TRUE
    `, []);
    return result.rows;
}

async function hasSlotsForDay(technicianId, day) {
    const result = await query('SELECT 1 FROM slot WHERE technician_id = $1 AND day = $2 LIMIT 1', [technicianId, day]);
    return result.rows.length > 0;
}

function generateDaySlots(fees, zoneId, technicianId, day) {
    const slots = [];
    let cursor = { hour: WORK_START_HOUR, minute: 0 };
    let feeIndex = 0;

    while (true) {
        const fee = fees[feeIndex % fees.length];
        const next = addMinutes(cursor.hour, cursor.minute, fee.duration);
        if (next.hour > WORK_END_HOUR || (next.hour === WORK_END_HOUR && next.minute > 0)) break;

        slots.push({
            start_at: toTimeString(cursor),
            ended_at: toTimeString(next),
            day,
            zone_id: zoneId,
            fee_id: fee.fee_id,
            technician_id: technicianId,
        });

        cursor = next;
        feeIndex++;
    }
    return slots;
}

async function generateSlots() {
    const fees = await getActiveFees();
    if (fees.length === 0) {
        console.log('Aucun forfait actif rien à générer.');
        return;
    }

    const assignments = await getTechnicianZoneAssignments();
    if (assignments.length === 0) {
        console.log('Aucun technicien assigné à une zone (table positionner vide) rien à générer.');
        return;
    }

    let totalCreated = 0;

    for (const { zone_id, technician_id } of assignments) {
        for (let i = 0; i < DAYS_AHEAD; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            if (!WORKING_WEEKDAYS.includes(date.getDay())) continue;

            const day = toDateString(date);
            if (await hasSlotsForDay(technician_id, day)) continue;

            const daySlots = generateDaySlots(fees, zone_id, technician_id, day);
            for (const slot of daySlots) {
                await query(
                    `INSERT INTO slot (start_at, ended_at, day, zone_id, fee_id, technician_id) VALUES ($1, $2, $3, $4, $5, $6)`,
                    [slot.start_at, slot.ended_at, slot.day, slot.zone_id, slot.fee_id, slot.technician_id]
                );
                totalCreated++;
            }
            console.log(`Technicien ${technician_id} - ${day} - ${daySlots.length} créneau(x) généré(s)`);
        }
    }

    console.log(`\nTerminé : ${totalCreated} créneau(x) créé(s) au total.`);
}

generateSlots()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Erreur fatale pendant la génération :', err);
        process.exit(1);
    });
