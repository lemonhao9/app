import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllInterventions, type InterventionListItem } from '../services/interventions';
import { getZones, type Zone } from '../services/zones';
import { getAllFees, type Fee } from '../services/fees';
import { getClients, getUserBikes, type ClientOption, type BikeOption } from '../services/users';

const STATE_LABELS: Record<string, string> = {
    'prochainement': 'À venir',
    'en cours': 'En cours',
    'terminée': 'Terminée',
    'annulée': 'Annulée',
};

function formatTime(time: string): string {
    return time.slice(0, 5);
}

function formatDay(day: string): string {
    return new Date(day).toLocaleDateString('fr-FR');
}

const PAGE_SIZE = 6;

export function AdminInterventions() {
    const [interventions, setInterventions] = useState<InterventionListItem[]>([]);
    const [zoneOptions, setZoneOptions] = useState<Zone[]>([]);
    const [clientOptions, setClientOptions] = useState<ClientOption[]>([]);
    const [bikeOptions, setBikeOptions] = useState<BikeOption[]>([]);
    const [feeOptions, setFeeOptions] = useState<Fee[]>([]);
    const [date, setDate] = useState('');
    const [startAt, setStartAt] = useState('');
    const [zoneId, setZoneId] = useState('');
    const [clientId, setClientId] = useState('');
    const [bikeId, setBikeId] = useState('');
    const [feeId, setFeeId] = useState('');
    const [sort, setSort] = useState<'asc' | 'desc'>('desc');
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([getZones(), getClients(), getAllFees()])
            .then(([zonesData, clientsData, feesData]) => {
                setZoneOptions(zonesData.zones);
                setClientOptions(clientsData.users);
                setFeeOptions(feesData.fees);
            })
            .catch(() => { });
    }, []);

    useEffect(() => {
        if (!clientId) return;
        getUserBikes(Number(clientId))
            .then(data => setBikeOptions(data.bikes))
            .catch(() => setBikeOptions([]));
    }, [clientId]);

    function load(reset: boolean) {
        const currentOffset = reset ? 0 : offset;
        setLoading(true);
        setError(null);
        getAllInterventions({
            date: date || undefined,
            start_at: startAt || undefined,
            zone_id: zoneId ? Number(zoneId) : undefined,
            client_id: clientId ? Number(clientId) : undefined,
            bike_id: bikeId ? Number(bikeId) : undefined,
            fee_id: feeId ? Number(feeId) : undefined,
            sort,
            limit: PAGE_SIZE,
            offset: currentOffset,
        })
            .then(({ interventions, hasMore }) => {
                setInterventions(prev => reset ? interventions : [...prev, ...interventions]);
                setHasMore(hasMore);
                setOffset(currentOffset + PAGE_SIZE);
            })
            .catch(() => setError('Impossible de charger les interventions.'))
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        load(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, startAt, zoneId, clientId, bikeId, feeId, sort]);

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-black uppercase tracking-wide">Interventions</h1>

            <div className="flex flex-wrap gap-2">
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                <input type="time" value={startAt} onChange={e => setStartAt(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                <select value={zoneId} onChange={e => setZoneId(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option value="">Toutes les zones</option>
                    {zoneOptions.map(z => <option key={z.zone_id} value={z.zone_id}>{z.name}</option>)}
                </select>
                <select value={clientId} onChange={e => { setClientId(e.target.value); setBikeId(''); setBikeOptions([]); }} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option value="">Tous les clients</option>
                    {clientOptions.map(c => <option key={c.user_id} value={c.user_id}>{c.name}</option>)}
                </select>
                <select value={bikeId} onChange={e => setBikeId(e.target.value)} disabled={!clientId} className="border border-gray-300 rounded-md px-3 py-2 text-sm disabled:opacity-50">
                    <option value="">{clientId ? 'Tous les vélos' : "Choisir d'abord un client"}</option>
                    {bikeOptions.map(b => <option key={b.bike_id} value={b.bike_id}>{`${b.brand ?? ''} ${b.model ?? ''}`.trim() || `Vélo n°${b.bike_id}`}</option>)}
                </select>
                <select value={feeId} onChange={e => setFeeId(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option value="">Tous les forfaits</option>
                    {feeOptions.map(f => <option key={f.fee_id} value={f.fee_id}>{f.name_fee}</option>)}
                </select>
                <select value={sort} onChange={e => setSort(e.target.value as 'asc' | 'desc')} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option value="desc">Date : plus récente à plus ancienne</option>
                    <option value="asc">Date : plus ancienne à plus récente</option>
                </select>
            </div>

            {loading && interventions.length === 0 && <p className="text-sm text-gray-500">Chargement...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!loading && !error && interventions.length === 0 && (
                <p className="text-sm text-gray-500">Aucune intervention pour ces filtres.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {interventions.map(iv => (
                    <Link key={iv.intervention_id} to={`/admin/interventions/${iv.intervention_id}`} className="border rounded-xl p-4 bg-white flex flex-col gap-2 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <p className="font-bold text-sm">{formatDay(iv.day)} — {formatTime(iv.start_at)}</p>
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{STATE_LABELS[iv.state] ?? iv.state}</span>
                        </div>
                        <p className="text-sm">{iv.bike_brand} {iv.bike_model} — {iv.client_name}</p>
                        <p className="text-xs text-gray-600">{iv.name_fee} — Zone {iv.zone_name}</p>
                        <p className="text-xs text-gray-600">{iv.technician_name ? `Technicien : ${iv.technician_name}` : 'Aucun technicien assigné'}</p>
                        <p className="text-xs text-gray-600">{iv.address_name}{iv.city ? `, ${iv.city}` : ''}</p>
                    </Link>
                ))}
            </div>

            {hasMore && (
                <button type="button" onClick={() => load(false)} className="self-center border rounded-md px-4 py-2 text-sm hover:bg-gray-50">
                    Afficher plus
                </button>
            )}
        </div>
    );
}