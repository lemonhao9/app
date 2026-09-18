import { useCallback, useEffect, useState } from 'react';
import { getAllFees, createFee, updateFee, desactivateFee, deleteFeePermanently, type Fee } from '../services/fees';
import { Button } from '../components/ui/button';

export function AdminForfaits() {
    const [fees, setFees] = useState<Fee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [nameFee, setNameFee] = useState('');
    const [priceFee, setPriceFee] = useState('');
    const [duration, setDuration] = useState('');
    const [description, setDescription] = useState('');
    const [optionalTitle, setOptionalTitle] = useState('');
    const [optionalPrice, setOptionalPrice] = useState('');
    const [optionalDesc, setOptionalDesc] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const refresh = useCallback(() => {
        getAllFees()
            .then(data => setFees(data.fees))
            .catch(() => setError('Impossible de charger les forfaits.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    function resetForm() {
        setEditingId(null);
        setNameFee(''); setPriceFee(''); setDuration('');
        setDescription(''); setOptionalTitle(''); setOptionalPrice(''); setOptionalDesc('');
    }

    function startEdit(fee: Fee) {
        setEditingId(fee.fee_id);
        setNameFee(fee.name_fee);
        setPriceFee(String(fee.price_fee));
        setDuration(String(fee.duration));
        setDescription(fee.description_forfait ?? '');
        setOptionalTitle(fee.optional_title ?? '');
        setOptionalPrice(fee.optional_price ? String(fee.optional_price) : '');
        setOptionalDesc(fee.optional_desc ?? '');
        setFormError(null);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormError(null);
        setSubmitting(true);
        const data = {
            name_fee: nameFee,
            price_fee: Number(priceFee),
            duration: Number(duration),
            description_forfait: description || undefined,
            optional_title: optionalTitle || undefined,
            optional_price: optionalPrice ? Number(optionalPrice) : undefined,
            optional_desc: optionalDesc || undefined,
        };
        try {
            if (editingId) {
                await updateFee(editingId, data);
            } else {
                await createFee(data);
            }
            resetForm();
            refresh();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "Impossible d'enregistrer ce forfait.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDesactivate(id: number) {
        if (editingId === id) resetForm();
        await desactivateFee(id);
        refresh();
    }

    async function handleDeletePermanently(id: number) {
        setDeleteError(null);
        try {
            await deleteFeePermanently(id);
            refresh();
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : 'Impossible de supprimer ce forfait.');
        }
    }


    const active = fees.filter(f => f.is_active);
    const inactive = fees.filter(f => !f.is_active);

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-black uppercase tracking-wide">Forfaits</h1>

            <form onSubmit={handleSubmit} className="border rounded-xl p-4 bg-white flex flex-col gap-2">
                <h2 className="font-bold text-sm uppercase">{editingId ? 'Modifier le forfait' : 'Nouveau forfait'}</h2>
                <div className="flex flex-wrap gap-2">
                    <input placeholder="Nom" value={nameFee} onChange={e => setNameFee(e.target.value)} required className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                    <input type="number" step="0.01" placeholder="Prix (€)" value={priceFee} onChange={e => setPriceFee(e.target.value)} required className="border border-gray-300 rounded-md px-3 py-2 text-sm w-32" />
                    <input type="number" placeholder="Durée (min)" value={duration} onChange={e => setDuration(e.target.value)} required className="border border-gray-300 rounded-md px-3 py-2 text-sm w-36" />
                </div>
                <textarea placeholder="Description (optionnel)" value={description} onChange={e => setDescription(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                <div className="flex flex-wrap gap-2">
                    <input placeholder="Titre de l'option (optionnel)" value={optionalTitle} onChange={e => setOptionalTitle(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                    <input type="number" step="0.01" placeholder="Prix de l'option (€)" value={optionalPrice} onChange={e => setOptionalPrice(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm w-40" />
                    <input placeholder="Description de l'option" value={optionalDesc} onChange={e => setOptionalDesc(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
                {formError && <p className="text-sm text-red-600">{formError}</p>}
                <div className="flex gap-2">
                    <Button type="submit" disabled={submitting} className="w-fit">
                        {submitting ? 'Enregistrement...' : editingId ? 'Enregistrer les modifications' : 'Créer le forfait'}
                    </Button>
                    {editingId && (
                        <Button type="button" variant="outline" className="w-fit" onClick={resetForm}>
                            Annuler
                        </Button>
                    )}
                </div>
            </form>

            {loading && <p className="text-sm text-gray-500">Chargement...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {active.map(fee => (
                    <div key={fee.fee_id} className="border rounded-xl p-4 bg-white flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <p className="font-bold text-sm">{fee.name_fee}</p>
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Actif</span>
                        </div>
                        <p className="text-sm">{fee.price_fee} € — {fee.duration} min</p>
                        {fee.description_forfait && <p className="text-xs text-gray-600">{fee.description_forfait}</p>}
                        {fee.optional_title && (
                            <p className="text-xs text-gray-600">Option : {fee.optional_title} (+{fee.optional_price} €)</p>
                        )}
                        <Button variant="outline" size="sm" className="w-fit" onClick={() => startEdit(fee)}>Modifier</Button>
                        <Button variant="destructive" size="sm" className="w-fit" onClick={() => handleDesactivate(fee.fee_id)}>Désactiver</Button>
                    </div>
                ))}
            </div>

            {inactive.length > 0 && (
                <>
                    <h2 className="font-bold text-sm uppercase text-gray-500">Forfaits désactivés</h2>
                    {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {inactive.map(fee => (
                            <div key={fee.fee_id} className="border rounded-xl p-4 bg-gray-50 flex flex-col gap-2 opacity-60">
                                <p className="font-bold text-sm">{fee.name_fee}</p>
                                <p className="text-sm">{fee.price_fee} € — {fee.duration} min</p>
                                <Button variant="destructive" size="sm" className="w-fit" onClick={() => handleDeletePermanently(fee.fee_id)}>Supprimer définitivement</Button>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
