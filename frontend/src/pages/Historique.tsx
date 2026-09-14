import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON as GeoJsonLayer } from "react-leaflet";

interface InterventionSummary {
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
    zone_color: string | null;
    geojson: GeoJSON.Feature;
    technician_name: string | null;
    address_name: string;
    city: string | null;
    latitude: number;
    longitude: number;
}

const STATE_LABELS: Record<string, string> = {
    'prochainement': 'À venir',
    'en cours': 'En cours',
    'terminée': 'Terminée',
    'annulée': 'Annulée',
};

function formatDuration(minutes: number): string {
    if (minutes === 45) return "30-45 minutes";
    if (minutes >= 60) return `${Math.floor(minutes / 60)}h`;
    return `${minutes} minutes`;
}

function formatTime(time: string): string {
    return time.slice(0, 5);
}

function formatDay(day: string): string {
    return new Date(day).toLocaleDateString('fr-FR');
}

const PAGE_SIZE = 6;

export function Historique() {
    const [interventions, setInterventions] = useState<InterventionSummary[]>([]);
    const [sort, setSort] = useState<'asc' | 'desc'>('desc');
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('hch_token');
        setLoading(true);
        setError(null);
        fetch(`/api/v1/interventions/me?sort=${sort}&limit=${PAGE_SIZE}&offset=0`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => { if (!res.ok) throw new Error(); return res.json(); })
            .then(data => {
                setInterventions(data.interventions);
                setHasMore(data.hasMore);
                setOffset(PAGE_SIZE);
            })
            .catch(() => setError('Impossible de charger votre historique.'))
            .finally(() => setLoading(false));
    }, [sort]);

    function loadMore() {
        const token = localStorage.getItem('hch_token');
        fetch(`/api/v1/interventions/me?sort=${sort}&limit=${PAGE_SIZE}&offset=${offset}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => { if (!res.ok) throw new Error(); return res.json(); })
            .then(data => {
                setInterventions(prev => [...prev, ...data.interventions]);
                setHasMore(data.hasMore);
                setOffset(prev => prev + PAGE_SIZE);
            })
            .catch(() => setError('Impossible de charger la suite.'));
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black uppercase tracking-wide">Historique des rendez-vous</h1>
                <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as 'asc' | 'desc')}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                    <option value="desc">Date : plus récente à plus ancienne</option>
                    <option value="asc">Date : plus ancienne à plus récente</option>
                </select>
            </div>

            {loading && <p className="text-sm text-gray-500">Chargement...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!loading && !error && interventions.length === 0 && (
                <p className="text-sm text-gray-500">Aucun rendez-vous pour le moment.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {interventions.map(iv => (
                    <div key={iv.intervention_id} className="border rounded-xl p-4 bg-white flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <p className="font-bold text-sm">Rendez-vous du {formatDay(iv.day)}</p>
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{STATE_LABELS[iv.state] ?? iv.state}</span>
                        </div>
                        <p className="text-sm">Intervention pour <span className="font-semibold">{iv.bike_brand} {iv.bike_model}</span></p>
                        <p className="text-xs text-gray-600">{iv.name_fee} ({formatDuration(iv.duration)})</p>
                        <p className="text-xs text-gray-600">De {formatTime(iv.start_at)} à {formatTime(iv.ended_at)}</p>
                        {iv.technician_name && <p className="text-xs text-gray-600">Technicien : {iv.technician_name}</p>}
                        <p className="text-xs text-gray-600">{iv.address_name}{iv.city ? `, ${iv.city}` : ''} — Zone {iv.zone_name}</p>
                        <div style={{ height: '150px' }}>
                            <MapContainer center={[iv.latitude, iv.longitude]} zoom={12} style={{ height: '100%' }} zoomControl={false} dragging={false} scrollWheelZoom={false}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                                <GeoJsonLayer key={iv.zone_id} data={iv.geojson} style={{ color: iv.zone_color ?? '#3388ff' }} />
                            </MapContainer>
                        </div>
                    </div>
                ))}
            </div>

            {hasMore && (
                <button
                    type="button"
                    onClick={loadMore}
                    className="self-center border rounded-md px-4 py-2 text-sm hover:bg-gray-50"
                >
                    Afficher plus
                </button>
            )}
        </div>
    );
}
