export const APP_TIMEZONE = process.env.APP_TIMEZONE ?? 'Europe/Paris';

export function todayInTimezone(now = new Date(), timeZone = APP_TIMEZONE) {
    return new Intl.DateTimeFormat('en-CA', { timeZone }).format(now);
}

export function addDays(isoDate, days) {
    const d = new Date(`${isoDate}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

export function weekdayOf(isoDate) {
    return new Date(`${isoDate}T12:00:00Z`).getUTCDay();
}

export function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

export function minutesToTime(total) {
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}:00`;
}

function fillGap(fees, start, end, startIndex) {
    const slots = [];
    let cursor = start;
    let index = startIndex;

    while (true) {
        let chosen = -1;
        for (let k = 0; k < fees.length; k++) {
            const candidate = (index + k) % fees.length;
            if (cursor + fees[candidate].duration <= end) {
                chosen = candidate;
                break;
            }
        }
        if (chosen === -1) break;

        const fee = fees[chosen];
        slots.push({ start_at: minutesToTime(cursor), ended_at: minutesToTime(cursor + fee.duration), fee_id: fee.fee_id });
        cursor += fee.duration;
        index = (chosen + 1) % fees.length;
    }
    return { slots, nextIndex: index };
}

export function planDay(fees, kept, window) {
    if (fees.length === 0) return [];

    const obstacles = kept
        .map(s => ({ start: timeToMinutes(s.start_at), end: timeToMinutes(s.ended_at) }))
        .sort((a, b) => a.start - b.start);

    const plan = [];
    let cursor = window.startMinutes;
    let index = 0;

    for (const obstacle of [...obstacles, { start: window.endMinutes, end: window.endMinutes }]) {
        const gapEnd = Math.min(obstacle.start, window.endMinutes);
        if (gapEnd > cursor) {
            const { slots, nextIndex } = fillGap(fees, cursor, gapEnd, index);
            plan.push(...slots);
            index = nextIndex;
        }
        cursor = Math.max(cursor, obstacle.end);
    }
    return plan;
}

export function decideDay(existing, fees, window) {
    if (existing.length === 0) {
        return { action: 'create', plan: planDay(fees, [], window) };
    }

    const durationById = new Map(fees.map(f => [f.fee_id, f.duration]));
    const presentIds = new Set(existing.map(s => s.fee_id));
    const hasStaleFreeSlot = existing.some(s =>
        !s.locked && durationById.get(s.fee_id) !== timeToMinutes(s.ended_at) - timeToMinutes(s.start_at)
    );
    const missingIds = fees.map(f => f.fee_id).filter(id => !presentIds.has(id));

    const replan = planDay(fees, existing.filter(s => s.locked), window);
    if (hasStaleFreeSlot || replan.some(p => missingIds.includes(p.fee_id))) {
        return { action: 'replace', plan: replan };
    }

    const fill = planDay(fees, existing, window);
    return fill.length > 0 ? { action: 'fill', plan: fill } : { action: 'keep', plan: [] };
}