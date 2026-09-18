import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getInterventionDetail, type InterventionDetail } from '../services/interventions';

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

export function AdminInterventionDetail() {
    const { id } = useParams();
    const [intervention, setIntervention] = useState<InterventionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        getInterventionDetail(id!)
            .then(data => setIntervention(data.intervention))
            .catch(() => setError("Impossible de charger cette intervention."))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <p className="text-sm text-gray-500">Chargement...</p>;
    if (error || !intervention) return <p className="text-sm text-red-600">{error ?? "Intervention introuvable."}</p>;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black uppercase tracking-wide">Intervention du {formatDay(intervention.day)}</h1>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{STATE_LABELS[intervention.state] ?? intervention.state}</span>
            </div>
            <Link to="/admin/interventions" className="text-sm underline text-gray-600 w-fit">&larr; Retour à la liste</Link>

            <div className="border rounded-xl p-4 bg-white flex flex-col gap-2">
                <h2 className="font-bold text-sm uppercase">Créneau</h2>
                <p className="text-sm">De {formatTime(intervention.start_at)} à {formatTime(intervention.ended_at)} — Zone {intervention.zone_name}</p>
                <p className="text-sm">{intervention.address_name}{intervention.city ? `, ${intervention.postal_code} ${intervention.city}` : ''}</p>
                {intervention.total_price != null && (
                    <p className="text-sm">Prix : {intervention.total_price} € — {intervention.is_paid ? 'Réglé' : 'Non réglé'}</p>
                )}
            </div>

            <div className="border rounded-xl p-4 bg-white flex flex-col gap-2">
                <h2 className="font-bold text-sm uppercase">Client</h2>
                <p className="text-sm">{intervention.client_name}</p>
                <p className="text-sm">{intervention.client_email}</p>
                {intervention.client_phone && <p className="text-sm">{intervention.client_phone}</p>}
            </div>

            <div className="border rounded-xl p-4 bg-white flex flex-col gap-2">
                <h2 className="font-bold text-sm uppercase">Technicien</h2>
                {intervention.technician_name ? (
                    <>
                        <p className="text-sm">{intervention.technician_name}</p>
                        <p className="text-sm">{intervention.technician_email}</p>
                        {intervention.technician_phone && <p className="text-sm">{intervention.technician_phone}</p>}
                    </>
                ) : <p className="text-sm text-gray-500">Aucun technicien assigné.</p>}
            </div>

            <div className="border rounded-xl p-4 bg-white flex flex-col gap-2">
                <h2 className="font-bold text-sm uppercase">Vélo</h2>
                <p className="text-sm">{intervention.bike_brand} {intervention.bike_model} {intervention.bike_year ? `(${intervention.bike_year})` : ''}</p>
                <p className="text-xs text-gray-600">{intervention.bike_type}{intervention.is_electric ? ' — électrique' : ''}</p>
            </div>

            <div className="border rounded-xl p-4 bg-white flex flex-col gap-2">
                <h2 className="font-bold text-sm uppercase">Forfait</h2>
                <p className="text-sm">{intervention.name_fee} — {intervention.price_fee} €</p>
            </div>

            <div className="border rounded-xl p-4 bg-white flex flex-col gap-2">
                <h2 className="font-bold text-sm uppercase">Produits additionnels</h2>
                {intervention.products.length === 0 && <p className="text-sm text-gray-500">Aucun produit additionnel.</p>}
                {intervention.products.map(p => (
                    <p key={p.product_id} className="text-sm">{p.quantity} × {p.name} — {p.price} €</p>
                ))}
            </div>

            <div className="border rounded-xl p-4 bg-white flex flex-col gap-3">
                <h2 className="font-bold text-sm uppercase">Photos</h2>
                {intervention.photos.length === 0 && <p className="text-sm text-gray-500">Aucune photo.</p>}
                {intervention.photos.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {intervention.photos.map(p => (
                            <a key={p.photo_id} href={p.url} target="_blank" rel="noreferrer">
                                <img src={p.url} alt="Photo de l'intervention" className="w-full h-24 object-cover rounded-md" />
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
