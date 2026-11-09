import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import type { EventClickInfo, EventInput, EventSourceFuncInfo } from '@fullcalendar/react';
import classicThemePlugin from '@fullcalendar/react/themes/classic';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import frLocale from '@fullcalendar/react/locales/fr';
import '@fullcalendar/react/skeleton.css';
import '@fullcalendar/react/themes/classic/theme.css';
import '@fullcalendar/react/themes/classic/palette.css';
import { getPlanning, type PlanningIntervention } from '../services/interventions';
import { getTechnicians, type TechnicianListItem } from '../services/users';
import { getZones, type Zone } from '../services/zones';

const STATE_COLORS: Record<PlanningIntervention['state'], string> = {
    prochainement: '#2563eb',
    'en cours': '#d97706',
    terminée: '#16a34a',
};

const STATE_LABELS: Record<PlanningIntervention['state'], string> = {
    prochainement: 'Prochainement',
    'en cours': 'En cours',
    terminée: 'Terminée',
};

export function AdminPlanning() {
    const navigate = useNavigate();
    const [technicians, setTechnicians] = useState<TechnicianListItem[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [technicianId, setTechnicianId] = useState('');
    const [zoneId, setZoneId] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([getTechnicians(), getZones()])
            .then(([t, z]) => {
                setTechnicians(t.users);
                setZones(z.zones);
            })
            .catch(err => setError((err as Error).message));
    }, []);

    const loadEvents = useCallback(async (info: EventSourceFuncInfo): Promise<EventInput[]> => {
        setError(null);
        try {
            const { interventions } = await getPlanning({
                start: info.startStr.slice(0, 10),
                end: info.endStr.slice(0, 10),
                technician_id: technicianId ? Number(technicianId) : undefined,
                zone_id: zoneId ? Number(zoneId) : undefined,
            });
            return interventions.map(iv => ({
                id: String(iv.intervention_id),
                title: technicianId
                    ? `${iv.client_name} — ${iv.name_fee}`
                    : `${iv.technician_name ?? 'Non assigné'} · ${iv.client_name}`,
                start: iv.start,
                end: iv.end,
                color: STATE_COLORS[iv.state],
            }));
        } catch (err) {
            setError((err as Error).message);
            return [];
        }
    }, [technicianId, zoneId]);

    function handleEventClick(info: EventClickInfo) {
        navigate(`/admin/interventions/${info.event.id}`);
    }

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold">Planning</h1>

            <div className="flex flex-wrap gap-3 items-end bg-white border rounded-md p-4">
                <div className="flex flex-col gap-1">
                    <label htmlFor="planning-technician" className="text-sm font-medium">Technicien</label>
                    <select id="planning-technician" value={technicianId} onChange={e => setTechnicianId(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                        <option value="">Tous</option>
                        {technicians.map(t => (
                            <option key={t.user_id} value={t.user_id}>{t.name}{t.is_active ? '' : ' (désactivé)'}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label htmlFor="planning-zone" className="text-sm font-medium">Zone</label>
                    <select id="planning-zone" value={zoneId} onChange={e => setZoneId(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                        <option value="">Toutes</option>
                        {zones.map(z => <option key={z.zone_id} value={z.zone_id}>{z.name}</option>)}
                    </select>
                </div>
                <ul className="flex gap-4 text-sm ml-auto" aria-label="Légende">
                    {(Object.keys(STATE_COLORS) as PlanningIntervention['state'][]).map(state => (
                        <li key={state} className="flex items-center gap-1">
                            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: STATE_COLORS[state] }} />
                            {STATE_LABELS[state]}
                        </li>
                    ))}
                </ul>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="bg-white border rounded-md p-4">
                <FullCalendar
                    plugins={[classicThemePlugin, dayGridPlugin, timeGridPlugin]}
                    initialView="timeGridWeek"
                    locale={frLocale}
                    timeZone="Europe/Paris"
                    firstDay={1}
                    headerToolbar={{ start: 'prev,next today', center: 'title', end: 'timeGridDay,timeGridWeek,dayGridMonth' }}
                    slotMinTime="08:00:00"
                    slotMaxTime="19:00:00"
                    allDaySlot={false}
                    nowIndicator
                    height="auto"
                    events={loadEvents}
                    eventClick={handleEventClick}
                />
            </div>
        </div>
    );
}
