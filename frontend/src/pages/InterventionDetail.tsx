import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

interface Photo {
    photo_id: number;
    url: string;
    created_at: string;
}

interface Product {
    product_id: number;
    name: string;
    category: string | null;
    price: string;
    quantity: number;
}

interface InterventionDetail {
    intervention_id: number;
    state: string;
    total_price: string | null;
    is_paid: boolean;
    client_name: string | null;
    client_phone: string | null;
    client_email: string;
    bike_brand: string | null;
    bike_model: string | null;
    bike_type: string | null;
    bike_year: number | null;
    is_electric: boolean;
    name_fee: string;
    price_fee: string;
    duration: number;
    day: string;
    start_at: string;
    ended_at: string;
    zone_name: string;
    address_name: string;
    city: string | null;
    postal_code: string | null;
    products: Product[];
    photos: Photo[];
}


const STATE_LABELS: Record<string, string> = {
    'prochainement': 'À venir',
    'en cours': 'En cours',
    'terminée': 'Terminée',
};

function formatTime(time: string): string {
    return time.slice(0, 5);
}

function formatDay(day: string): string {
    return new Date(day).toLocaleDateString('fr-FR');
}

export function InterventionDetail() {
    const { id } = useParams();
    const [intervention, setIntervention] = useState<InterventionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [price, setPrice] = useState('');
    const [isPaid, setIsPaid] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);

    function loadIntervention() {
        const token = localStorage.getItem('hch_token');
        return fetch(`/api/v1/interventions/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => { if (!res.ok) throw new Error(); return res.json(); })
            .then(data => {
                setIntervention(data.intervention);
                setPrice(data.intervention.total_price ?? '');
                setIsPaid(data.intervention.is_paid);
            });
    }

    useEffect(() => {
        setLoading(true);
        loadIntervention()
            .catch(() => setError("Impossible de charger cette intervention."))
            .finally(() => setLoading(false));
    }, [id]);

    function handleStart() {
        const token = localStorage.getItem('hch_token');
        setActionLoading(true);
        setActionError(null);
        fetch(`/api/v1/interventions/${id}/start`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => { if (!res.ok) throw new Error(); return res.json(); })
            .then(data => setIntervention(data.intervention))
            .catch(() => setActionError("Impossible de démarrer l'intervention."))
            .finally(() => setActionLoading(false));
    }

    function handleComplete(e: React.FormEvent) {
        e.preventDefault();
        const token = localStorage.getItem('hch_token');
        setActionLoading(true);
        setActionError(null);
        fetch(`/api/v1/interventions/${id}/complete`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ total_price: Number(price), is_paid: isPaid }),
        })
            .then(res => { if (!res.ok) throw new Error(); return res.json(); })
            .then(data => setIntervention(data.intervention))
            .catch(() => setActionError("Impossible de clôturer l'intervention."))
            .finally(() => setActionLoading(false));
    }

    function handleUploadPhotos(e: React.FormEvent) {
        e.preventDefault();
        if (photoFiles.length === 0) return;
        const token = localStorage.getItem('hch_token');
        setActionLoading(true);
        setActionError(null);
        const formData = new FormData();
        photoFiles.forEach(file => formData.append('photos', file));
        fetch(`/api/v1/interventions/${id}/photos`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        })
            .then(res => { if (!res.ok) throw new Error(); })
            .then(() => { setPhotoFiles([]); return loadIntervention(); })
            .catch(() => setActionError("Impossible d'envoyer les photos."))
            .finally(() => setActionLoading(false));
    }

    function handleCancel() {
        if (!window.confirm("Confirmer l'annulation de cette intervention ?")) return;
        const token = localStorage.getItem('hch_token');
        setActionLoading(true);
        setActionError(null);
        fetch(`/api/v1/interventions/${id}/cancel`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => { if (!res.ok) throw new Error(); return res.json(); })
            .then(data => setIntervention(data.intervention))
            .catch(() => setActionError("Impossible d'annuler l'intervention."))
            .finally(() => setActionLoading(false));
    }


    if (loading) return <p className="text-sm text-gray-500">Chargement...</p>;
    if (error || !intervention) return <p className="text-sm text-red-600">{error ?? "Intervention introuvable."}</p>;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black uppercase tracking-wide">Intervention du {formatDay(intervention.day)}</h1>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{STATE_LABELS[intervention.state] ?? intervention.state}</span>
            </div>
            <Link to="/technician/agenda" className="text-sm underline text-gray-600 w-fit">&larr; Retour à l'agenda</Link>

            {actionError && <p className="text-sm text-red-600">{actionError}</p>}
            {(intervention.state === 'prochainement' || intervention.state === 'en cours') && (
                <button
                    type="button"
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="self-start border border-red-600 text-red-600 rounded-md px-4 py-2 text-sm hover:bg-red-50 disabled:opacity-50"
                >
                    Annuler l'intervention
                </button>
            )}

            {intervention.state === 'prochainement' && (
                <button
                    type="button"
                    onClick={handleStart}
                    disabled={actionLoading}
                    className="self-start bg-gray-900 text-white rounded-md px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
                >
                    Je commence l'intervention
                </button>
            )}

            {intervention.state === 'en cours' && (
                <form onSubmit={handleComplete} className="border rounded-xl p-4 bg-white flex flex-col gap-3">
                    <h2 className="font-bold text-sm uppercase">Clôturer l'intervention</h2>
                    <label className="text-sm flex flex-col gap-1">
                        Prix total (€)
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                    </label>
                    <label className="text-sm flex items-center gap-2">
                        <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} />
                        Réglé
                    </label>
                    <button
                        type="submit"
                        disabled={actionLoading}
                        className="self-start bg-gray-900 text-white rounded-md px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
                    >
                        Marquer terminée
                    </button>
                </form>
            )}

            <div className="border rounded-xl p-4 bg-white flex flex-col gap-2">
                <h2 className="font-bold text-sm uppercase">Créneau</h2>
                <p className="text-sm">De {formatTime(intervention.start_at)} à {formatTime(intervention.ended_at)} — Zone {intervention.zone_name}</p>
                <p className="text-sm">{intervention.address_name}{intervention.city ? `, ${intervention.postal_code} ${intervention.city}` : ''}</p>
            </div>

            <div className="border rounded-xl p-4 bg-white flex flex-col gap-2">
                <h2 className="font-bold text-sm uppercase">Contact client</h2>
                <p className="text-sm">{intervention.client_name}</p>
                <p className="text-sm">{intervention.client_email}</p>
                {intervention.client_phone && <p className="text-sm">{intervention.client_phone}</p>}
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

            <div className="border rounded-xl p-4 bg-white flex flex-col gap-3">
                <h2 className="font-bold text-sm uppercase">Photos</h2>
                {intervention.photos.length === 0 && <p className="text-sm text-gray-500">Aucune photo pour le moment.</p>}
                {intervention.photos.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {intervention.photos.map(p => (
                            <a key={p.photo_id} href={p.url} target="_blank" rel="noreferrer">
                                <img src={p.url} alt="Photo de l'intervention" className="w-full h-24 object-cover rounded-md" />
                            </a>
                        ))}
                    </div>
                )}
                {intervention.state === 'en cours' && (
                    <form onSubmit={handleUploadPhotos} className="flex flex-col gap-2">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => setPhotoFiles(Array.from(e.target.files ?? []))}
                            className="text-sm"
                        />
                        <button
                            type="submit"
                            disabled={actionLoading || photoFiles.length === 0}
                            className="self-start border rounded-md px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                        >
                            Ajouter {photoFiles.length > 0 ? `(${photoFiles.length})` : ''}
                        </button>
                    </form>
                )}
            </div>


            <div className="border rounded-xl p-4 bg-white flex flex-col gap-2">
                <h2 className="font-bold text-sm uppercase">Produits additionnels</h2>
                {intervention.products.length === 0 && <p className="text-sm text-gray-500">Aucun produit additionnel.</p>}
                {intervention.products.map(p => (
                    <p key={p.product_id} className="text-sm">{p.quantity} × {p.name} — {p.price} €</p>
                ))}
            </div>
        </div>
    );
}

