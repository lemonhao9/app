import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Cron } from 'croner';
import * as slotGenerationService from '../../src/services/slotGenerationService.js';
import { startSlotScheduler, runSlotSync } from '../../src/services/slotScheduler.js';

vi.mock('croner', () => ({ Cron: vi.fn() }));
vi.mock('../../src/services/slotGenerationService.js');

beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    slotGenerationService.syncSlots.mockResolvedValue({ created: 0, deleted: 0, days: 0 });
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
});

describe('slotScheduler.startSlotScheduler', () => {
    it('planifie la génération chaque jour à 03:00, heure de Paris, sans exécutions superposées', () => {
        startSlotScheduler();

        expect(Cron).toHaveBeenCalledWith(
            '0 3 * * *',
            expect.objectContaining({ timezone: 'Europe/Paris', protect: true }),
            expect.any(Function)
        );
    });

    it('lance une génération dès le démarrage pour rattraper une nuit manquée', () => {
        startSlotScheduler();

        expect(slotGenerationService.syncSlots).toHaveBeenCalledTimes(1);
    });

    it('lance la génération quand la tâche planifiée se déclenche', () => {
        startSlotScheduler();
        const scheduledTask = Cron.mock.calls[0][2];

        scheduledTask();

        expect(slotGenerationService.syncSlots).toHaveBeenCalledTimes(2);
    });

    it('ne planifie rien si SLOT_SCHEDULER_ENABLED vaut false', () => {
        vi.stubEnv('SLOT_SCHEDULER_ENABLED', 'false');

        const job = startSlotScheduler();

        expect(job).toBeNull();
        expect(Cron).not.toHaveBeenCalled();
        expect(slotGenerationService.syncSlots).not.toHaveBeenCalled();
    });
});

describe('slotScheduler.runSlotSync', () => {
    it('journalise le bilan de la génération', async () => {
        slotGenerationService.syncSlots.mockResolvedValue({ created: 9, deleted: 0, days: 1 });

        await runSlotSync('planifiée');

        expect(console.log).toHaveBeenCalledWith('Génération des créneaux (planifiée) : 1 jour(s), 9 créé(s), 0 supprimé(s)');
    });

    it("journalise l'échec sans faire tomber l'API", async () => {
        slotGenerationService.syncSlots.mockRejectedValue(new Error('base indisponible'));

        await expect(runSlotSync('planifiée')).resolves.toBeUndefined();

        expect(console.error).toHaveBeenCalledWith('Échec de la génération des créneaux (planifiée) :', expect.any(Error));
    });
});