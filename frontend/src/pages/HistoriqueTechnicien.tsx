import { useEffect, useState } from "react";

interface HistoryItem {
    intervention_id: number;
    state: string;
    total_price: string | null;
    bike_brand: string | null;
    bike_model: string | null;
    name_fee: string;
    duration: number;
    day: string;
    start_at: string;
    ended_at: string;
    zone_id: number;
    zone_name: string;
    client_id: number;
    client_name: string;
    address_name: string;
    city: string | null;
}

const STATE_LABELS: Record<string, string> = {
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

export function HistoriqueTechnicien() {
    const [interventions, setInterventions] = useState<HistoryItem[]>([]);
    const [zoneOptions, setZoneOptions] = useState<{ zone_id: number; zone_name: string }[]>([]);
    const [clientOptions, setClientOptions] = useState<{ client_id: number; client_name: string }[]>([]);
    const [date, setDate] = useState('');
    const [zoneId, setZoneId] = useState('');
    const [clientId, setClientId] = useState('');
    const [sort, setSort] = useState<'asc' | 'desc'>('desc');
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('hch_token');
        fetch('/api/v1/interventions/history?limit=50', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => { if (!res.ok) throw new Error(); return res.json(); })
            .then(data => {
                const zones = new Map<number, string>();
                const clients = new Map<number, string>();
                (data.interventions as HistoryItem[]).forEach(iv => {
                    zones.set(iv.zone_id, iv.zone_name);
                    clients.set(iv.client_id, iv.client_name);
                });
                setZoneOptions(Array.from(zones, ([zone_id, zone_name]) => ({ zone_id, zone_name })));
                setClientOptions(Array.from(clients, ([client_id, client_name]) => ({ client_id, client_name })));
            })
            .catch(() => { /* menus déroulants simplement vides si ça échoue */ });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function buildQuery(currentOffset: number) {
        const params = new URLSearchParams({ sort, limit: String(PAGE_SIZE), offset: String(currentOffset) });
        if (date) params.set('date', date);
        if (zoneId) params.set('zone_id', zoneId);
        if (clientId) params.set('client_id', clientId);
        return params.toString();
    }

    function load(reset: boolean) {
        const token = localStorage.getItem('hch_token');
        const currentOffset = reset ? 0 : offset;
        setLoading(true);
        setError(null);
        fetch(`/api/v1/interventions/history?${buildQuery(currentOffset)}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => { if (!res.ok) throw new Error(); return res.json(); })
            .then(data => {
                setInterventions(prev => reset ? data.interventions : [...prev, ...data.interventions]);
                setHasMore(data.hasMore);
                setOffset(currentOffset + PAGE_SIZE);
            })
            .catch(() => setError("Impossible de charger l'historique."))
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        load(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, zoneId, clientId, sort]);

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-black uppercase tracking-wide">Historique des interventions</h1>

            <div className="flex flex-wrap gap-2">
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
                <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option value="">Toutes les zones</option>
                    {zoneOptions.map(z => <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>)}
                </select>
                <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option value="">Tous les clients</option>
                    {clientOptions.map(c => <option key={c.client_id} value={c.client_id}>{c.client_name}</option>)}
                </select>
                <select value={sort} onChange={(e) => setSort(e.target.value as 'asc' | 'desc')} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option value="desc">Date : plus récente à plus ancienne</option>
                    <option value="asc">Date : plus ancienne à plus récente</option>
                </select>
            </div>

            {loading && interventions.length === 0 && <p className="text-sm text-gray-500">Chargement...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!loading && !error && interventions.length === 0 && (
                <p className="text-sm text-gray-500">Aucune intervention passée pour ces filtres.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {interventions.map(iv => (
                    <div key={iv.intervention_id} className="border rounded-xl p-4 bg-white flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <p className="font-bold text-sm">{formatDay(iv.day)}</p>
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{STATE_LABELS[iv.state] ?? iv.state}</span>
                        </div>
                        <p className="text-sm">{iv.bike_brand} {iv.bike_model} — {iv.client_name}</p>
                        <p className="text-xs text-gray-600">{iv.name_fee}, {formatTime(iv.start_at)}–{formatTime(iv.ended_at)} — Zone {iv.zone_name}</p>
                        <p className="text-xs text-gray-600">{iv.address_name}{iv.city ? `, ${iv.city}` : ''}</p>
                    </div>
                ))}
            </div>

            {hasMore && (
                <button
                    type="button"
                    onClick={() => load(false)}
                    className="self-center border rounded-md px-4 py-2 text-sm hover:bg-gray-50"
                >
                    Afficher plus
                </button>
            )}
        </div>
    );
}
