import { describe, it, expect } from 'vitest';
import { todayInTimezone, addDays, weekdayOf, planDay, decideDay } from '../../src/utils/slotPlanning.js';

const WINDOW = { startMinutes: 9 * 60, endMinutes: 18 * 60 };
const FEES = [
    { fee_id: 1, duration: 45 },
    { fee_id: 2, duration: 60 },
    { fee_id: 3, duration: 60 },
    { fee_id: 4, duration: 120 },
];

describe('slotPlanning — dates en heure de Paris', () => {
    it('donne encore le jour même à Paris à 23 h 30 UTC en hiver… et le lendemain après minuit', () => {
        expect(todayInTimezone(new Date('2026-11-25T22:30:00Z'), 'Europe/Paris')).toBe('2026-11-25');
        expect(todayInTimezone(new Date('2026-11-25T23:30:00Z'), 'Europe/Paris')).toBe('2026-11-26');
    });

    it('ajoute des jours sans être gêné par le changement d\'heure ni les fins de mois', () => {
        expect(addDays('2027-03-27', 1)).toBe('2027-03-28');
        expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
        expect(addDays('2026-12-31', 60)).toBe('2027-03-01');
    });

    it('donne le jour de la semaine (0 = dimanche)', () => {
        expect(weekdayOf('2026-11-29')).toBe(0);
        expect(weekdayOf('2026-11-30')).toBe(1);
    });
});

describe('slotPlanning.planDay', () => {
    it("bouche la fin de journée avec un forfait plus court quand le suivant ne tient plus", () => {
        const plan = planDay(FEES, [], WINDOW);

        expect(plan.map(s => s.fee_id)).toEqual([1, 2, 3, 4, 1, 2, 3, 1, 1]);
        expect(plan.at(-1)).toEqual({ start_at: '17:15:00', ended_at: '18:00:00', fee_id: 1 });
        expect(plan.every(s => s.ended_at <= '18:00:00')).toBe(true);
    });

    it('ne chevauche jamais un créneau conservé', () => {
        const kept = [{ start_at: '10:00:00', ended_at: '12:00:00' }];

        const plan = planDay(FEES, kept, WINDOW);

        expect(plan.some(s => s.start_at < '12:00:00' && s.ended_at > '10:00:00')).toBe(false);
        expect(plan[0]).toEqual({ start_at: '09:00:00', ended_at: '09:45:00', fee_id: 1 });
    });

    it('renvoie un plan vide sans forfait actif', () => {
        expect(planDay([], [], WINDOW)).toEqual([]);
    });
});

describe('slotPlanning.decideDay', () => {
    const fullDay = planDay(FEES, [], WINDOW).map(s => ({ ...s, locked: false }));

    it('crée la journée si elle n\'a aucun créneau', () => {
        const decision = decideDay([], FEES, WINDOW);

        expect(decision.action).toBe('create');
        expect(decision.plan).toHaveLength(9);
    });

    it('ne touche à rien si la journée est à jour', () => {
        expect(decideDay(fullDay, FEES, WINDOW).action).toBe('keep');
    });


    it('bouche un trou laissé par un forfait supprimé, sans toucher aux autres créneaux', () => {
        const existing = fullDay.filter(s => s.start_at !== '09:45:00');

        const decision = decideDay(existing, FEES, WINDOW);

        expect(decision.action).toBe('fill');
        expect(decision.plan).toEqual([{ start_at: '09:45:00', ended_at: '10:30:00', fee_id: 1 }]);
    });

    it("complète une ancienne journée de 7 créneaux sans la réorganiser", () => {
        const oldDay = fullDay.slice(0, 7);

        const decision = decideDay(oldDay, FEES, WINDOW);

        expect(decision.action).toBe('fill');
        expect(decision.plan).toEqual([
            { start_at: '16:30:00', ended_at: '17:15:00', fee_id: 1 },
            { start_at: '17:15:00', ended_at: '18:00:00', fee_id: 1 },
        ]);
    });

    it("recalcule la journée quand un créneau libre appartient à un forfait désactivé", () => {
        const activeFees = FEES.filter(f => f.fee_id !== 4);

        const decision = decideDay(fullDay, activeFees, WINDOW);

        expect(decision.action).toBe('replace');
        expect(decision.plan.some(s => s.fee_id === 4)).toBe(false);
    });

    it('recalcule la journée quand un nouveau forfait n\'y a aucun créneau', () => {
        const decision = decideDay(fullDay, [...FEES, { fee_id: 5, duration: 30 }], WINDOW);

        expect(decision.action).toBe('replace');
        expect(decision.plan.some(s => s.fee_id === 5)).toBe(true);
    });


    it("recalcule la journée quand la durée d'un forfait a changé", () => {
        const fees = FEES.map(f => (f.fee_id === 2 ? { ...f, duration: 90 } : f));

        const decision = decideDay(fullDay, fees, WINDOW);

        expect(decision.action).toBe('replace');
        expect(decision.plan.find(s => s.fee_id === 2)).toEqual({ start_at: '09:45:00', ended_at: '11:15:00', fee_id: 2 });
    });

    it('conserve les créneaux réservés et planifie autour', () => {
        const existing = fullDay.map(s => (s.start_at === '09:45:00' ? { ...s, locked: true } : s));
        const activeFees = FEES.filter(f => f.fee_id !== 4);

        const decision = decideDay(existing, activeFees, WINDOW);

        expect(decision.action).toBe('replace');
        const locked = existing.find(s => s.locked);
        expect(decision.plan.some(s => s.start_at < locked.ended_at && s.ended_at > locked.start_at)).toBe(false);
    });

    it("ne recalcule pas pour un créneau réservé d'un forfait désactivé (il reste, rien de libre à retirer)", () => {
        const existing = fullDay.map(s => (s.fee_id === 4 ? { ...s, locked: true } : s));

        expect(decideDay(existing, FEES.filter(f => f.fee_id !== 4), WINDOW).action).toBe('keep');
    });

    it("ne réorganise pas la journée si le forfait manquant ne peut pas y être placé", () => {
        const existing = [{ start_at: '09:00:00', ended_at: '18:00:00', fee_id: 1, locked: true }];

        expect(decideDay(existing, FEES, WINDOW).action).toBe('keep');
    });
});