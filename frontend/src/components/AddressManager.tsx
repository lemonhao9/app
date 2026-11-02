import { useEffect, useState } from 'react';
import { AddressAutocomplete } from './AddressAutocomplete';
import { Button } from './ui/button';
import { type Address, getMyAddresses, createAddress, updateAddress, setDefaultAddress, deleteAddress } from '../services/addresses';

const MAX_ADDRESSES = 10;

function ZoneStatus({ address }: { address: Address }) {
    if (!address.zone_id) {
        return <p className="text-xs text-orange-700">Hors zone desservie : aucun créneau ne pourra être proposé à cette adresse.</p>;
    }
    if (!address.zone_active) {
        return <p className="text-xs text-orange-700">Zone {address.zone_name} temporairement non desservie.</p>;
    }
    return <p className="text-xs text-green-700">Zone {address.zone_name}</p>;
}

function AddressForm({ pendingLabel, busy, confirmLabel, onSelect, onConfirm, onCancel }: {
    pendingLabel: string | null;
    busy: boolean;
    confirmLabel: string;
    onSelect: (label: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            <AddressAutocomplete onSelect={s => onSelect(s.label)} placeholder="Rechercher une adresse" />
            <div className="flex gap-2">
                <Button size="sm" disabled={!pendingLabel || busy} onClick={onConfirm}>
                    {busy ? 'Enregistrement...' : confirmLabel}
                </Button>
                <Button size="sm" variant="ghost" disabled={busy} onClick={onCancel}>Annuler</Button>
            </div>
        </div>
    );
}

export function AddressManager() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [pendingLabel, setPendingLabel] = useState<string | null>(null);

    useEffect(() => {
        getMyAddresses()
            .then(data => setAddresses(data.addresses))
            .catch(err => setError((err as Error).message));
    }, []);

    function closeForms() {
        setAdding(false);
        setEditingId(null);
        setPendingLabel(null);
    }

    async function run(action: () => Promise<unknown>) {
        setBusy(true);
        setError(null);
        try {
            await action();
            closeForms();
            const data = await getMyAddresses();
            setAddresses(data.addresses);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setBusy(false);
        }
    }

    function handleDelete(address: Address) {
        if (!window.confirm(`Supprimer l'adresse « ${address.address_name} » ? Vos rendez-vous déjà pris ne sont pas modifiés.`)) return;
        run(() => deleteAddress(address.address_id));
    }

    return (
        <section className="flex flex-col gap-3 mt-6">
            <h2 className="font-medium">Mes adresses</h2>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <ul className="flex flex-col gap-2">
                {addresses.map(a => (
                    <li key={a.address_id} className="border rounded-md p-3 flex flex-col gap-2 bg-white">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm">{a.address_name}</span>
                            {a.is_default && <span className="text-xs bg-gray-900 text-white rounded px-2 py-0.5">Par défaut</span>}
                        </div>
                        <ZoneStatus address={a} />
                        {editingId === a.address_id ? (
                            <AddressForm
                                pendingLabel={pendingLabel}
                                busy={busy}
                                confirmLabel="Enregistrer la modification"
                                onSelect={setPendingLabel}
                                onConfirm={() => pendingLabel && run(() => updateAddress(a.address_id, pendingLabel))}
                                onCancel={closeForms}
                            />
                        ) : (
                            <div className="flex gap-2 flex-wrap">
                                {!a.is_default && (
                                    <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => setDefaultAddress(a.address_id))}>Définir par défaut</Button>
                                )}
                                <Button size="sm" variant="outline" disabled={busy} onClick={() => { closeForms(); setEditingId(a.address_id); }}>Modifier</Button>
                                {addresses.length > 1 && (
                                    <Button size="sm" variant="destructive" disabled={busy} onClick={() => handleDelete(a)}>Supprimer</Button>
                                )}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
            {adding ? (
                <AddressForm
                    pendingLabel={pendingLabel}
                    busy={busy}
                    confirmLabel="Ajouter cette adresse"
                    onSelect={setPendingLabel}
                    onConfirm={() => pendingLabel && run(() => createAddress(pendingLabel))}
                    onCancel={closeForms}
                />
            ) : addresses.length < MAX_ADDRESSES ? (
                <Button variant="outline" disabled={busy} onClick={() => { closeForms(); setAdding(true); }}>Ajouter une adresse</Button>
            ) : (
                <p className="text-xs text-gray-500">Vous avez atteint le maximum de {MAX_ADDRESSES} adresses.</p>
            )}
        </section>
    );
}
