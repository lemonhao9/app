import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getInterventionDetail, cancelIntervention, reassignIntervention, getSlots, type InterventionDetail, type AvailableSlot } from '../services/interventions';
import { Button } from '../components/ui/button';

const STATE_LABELS: Record<string, string> = {
    'prochainement': 'À venir',
    'en cours': 'En cours',
    'terminée': 'Terminée',
    'annulée': 'Annulée',
};

const CANCELLABLE_STATES = ['prochainement', 'en cours'];

function formatTime(time: string): string {
    return time.slice(0, 5);
}

function formatDay(day: string): string {
    return new Date(day).toLocaleDateString('fr-FR');
}

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

export function AdminInterventionDetail() {
    const { id } = useParams();
    const [intervention, setIntervention] = useState<InterventionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [cancelling, setCancelling] = useState(false);

    const [showReassign, setShowReassign] = useState(false);
    const [day, setDay] = useState(todayISO());
    const [slots, setSlots] = useState<AvailableSlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [reassigning, setReassigning] = useState(false);

    const load = useCallback(() => {
        if (!id) return;
        setLoading(true);
        setError(null);
        getInterventionDetail(id)
            .then(data => setIntervention(data.intervention))
            .catch(() => setError("Impossible de charger cette intervention."))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!showReassign || !intervention) return;
        setLoadingSlots(true);
        getSlots(intervention.zone_id, intervention.fee_id, day)
            .then(data => setSlots(data.slots))
            .catch(() => setSlots([]))
            .finally(() => setLoadingSlots(false));
    }, [showReassign, day, intervention]);

    async function handleCancel() {
        if (!id) return;
        setCancelling(true);
        setActionError(null);
        try {
            await cancelIntervention(id);
            setShowReassign(false);
            load();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Impossible d'annuler l'intervention.");
        } finally {
            setCancelling(false);
        }
    }

    async function handleReassign(slotId: number) {
        if (!id) return;
        setReassigning(true);
        setActionError(null);
        try {
            await reassignIntervention(id, slotId);
            setShowReassign(false);
            load();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Impossible de réassigner ce créneau.");
        } finally {
            setReassigning(false);
        }
    }

    if (loading) return <p className="text-sm text-gray-500">Chargement...</p>;
    if (error || !intervention) return <p className="text-sm text-red-600">{error ?? "Intervention introuvable."}</p>;

    const canManage = CANCELLABLE_STATES.includes(intervention.state);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black uppercase tracking-wide">Intervention du {formatDay(intervention.day)}</h1>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{STATE_LABELS[intervention.state] ?? intervention.state}</span>
            </div>
            <Link to="/admin/interventions" className="text-sm underline text-gray-600 w-fit">&larr; Retour à la liste</Link>

            {actionError && <p className="text-sm text-red-600">{actionError}</p>}

            {canManage && (
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowReassign(v => !v)}>
                        {showReassign ? 'Fermer la réassignation' : 'Réassigner le créneau'}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleCancel} disabled={cancelling}>
                        {cancelling ? 'Annulation...' : "Annuler l'intervention"}
                    </Button>
                </div>
            )}

            {canManage && showReassign && (
                <div className="border rounded-xl p-4 bg-white flex flex-col gap-3">
                    <h2 className="font-bold text-sm uppercase">Nouveau créneau — Zone {intervention.zone_name}, {intervention.name_fee}</h2>
                    <input
                        type="date"
                        value={day}
                        min={todayISO()}
                        onChange={e => setDay(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm w-fit"
                    />
                    {loadingSlots && <p className="text-sm text-gray-500">Chargement des créneaux...</p>}
                    {!loadingSlots && slots.length === 0 && <p className="text-sm text-gray-500">Aucun créneau disponible ce jour-là.</p>}
                    {!loadingSlots && slots.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {slots.map(slot => (
                                <button
                                    key={slot.slot_id}
                                    type="button"
                                    disabled={!slot.available || reassigning}
                                    onClick={() => handleReassign(slot.slot_id)}
                                    className={`border rounded-md px-2 py-2 text-sm ${!slot.available ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                                >
                                    {formatTime(slot.start_at)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

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
