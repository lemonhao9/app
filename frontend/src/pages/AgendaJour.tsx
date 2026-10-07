import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON as GeoJsonLayer } from "react-leaflet";
import { Link } from "react-router-dom";

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
    address_name: string;
    city: string | null;
    latitude: number;
    longitude: number;
}

const STATE_LABELS: Record<string, string> = {
    'prochainement': 'À venir',
    'en cours': 'En cours',
    'terminée': 'Terminée',
};

function formatDuration(minutes: number): string {
    if (minutes === 45) return "30-45 minutes";
    if (minutes >= 60) return `${Math.floor(minutes / 60)}h`;
    return `${minutes} minutes`;
}

function formatTime(time: string): string {
    return time.slice(0, 5);
}

export function AgendaJour() {
    const [interventions, setInterventions] = useState<InterventionSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('hch_token');
        fetch('/api/v1/interventions/today', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => { if (!res.ok) throw new Error(); return res.json(); })
            .then(data => setInterventions(data.interventions))
            .catch(() => setError("Impossible de charger l'agenda du jour."))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-black uppercase tracking-wide">Agenda du jour</h1>

            {loading && <p className="text-sm text-gray-500">Chargement...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!loading && !error && interventions.length === 0 && (
                <p className="text-sm text-gray-500">Aucune intervention prévue aujourd'hui.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {interventions.map(iv => (
                    <Link key={iv.intervention_id} to={`/technician/intervention/${iv.intervention_id}`} className="border rounded-xl p-4 bg-white flex flex-col gap-2 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <p className="font-bold text-sm">{formatTime(iv.start_at)} – {formatTime(iv.ended_at)}</p>
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{STATE_LABELS[iv.state] ?? iv.state}</span>
                        </div>
                        <p className="text-sm">Intervention pour <span className="font-semibold">{iv.bike_brand} {iv.bike_model}</span></p>
                        <p className="text-xs text-gray-600">{iv.name_fee} ({formatDuration(iv.duration)})</p>
                        <p className="text-xs text-gray-600">{iv.address_name}{iv.city ? `, ${iv.city}` : ''} — Zone {iv.zone_name}</p>
                        <div style={{ height: '150px' }}>
                            <MapContainer center={[iv.latitude, iv.longitude]} zoom={12} style={{ height: '100%' }} zoomControl={false} dragging={false} scrollWheelZoom={false}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                                <GeoJsonLayer key={iv.zone_id} data={iv.geojson} style={{ color: iv.zone_color ?? '#3388ff' }} />
                            </MapContainer>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
