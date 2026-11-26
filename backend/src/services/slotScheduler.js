import { Cron } from 'croner';
import { syncSlots } from './slotGenerationService.js';
import { APP_TIMEZONE } from '../utils/slotPlanning.js';

export const SLOT_SYNC_CRON = process.env.SLOT_SYNC_CRON ?? '0 3 * * *';

export async function runSlotSync(reason) {
    try {
        const { created, deleted, days } = await syncSlots();
        console.log(`Génération des créneaux (${reason}) : ${days} jour(s), ${created} créé(s), ${deleted} supprimé(s)`);
    } catch (err) {
        console.error(`Échec de la génération des créneaux (${reason}) :`, err);
    }
}

export function startSlotScheduler() {
    if (process.env.SLOT_SCHEDULER_ENABLED === 'false') return null;

    const job = new Cron(
        SLOT_SYNC_CRON,
        { name: 'slot-sync', timezone: APP_TIMEZONE, protect: true },
        () => runSlotSync('planifiée')
    );
    runSlotSync('démarrage');
    return job;
}