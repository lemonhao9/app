import { useCallback, useEffect, useState, type SyntheticEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { getClientDetails, updateUserByAdmin, type ClientDetails } from '../services/users';
import { getAllInterventions, type InterventionListItem } from '../services/interventions';

const HISTORY_PAGE_SIZE = 10;

const STATE_LABELS: Record<string, string> = {
    'prochainement': 'À venir',
    'en cours': 'En cours',
    'terminée': 'Terminée',
    'annulée': 'Annulée',
};

function formatDay(day: string): string {
    return new Date(day).toLocaleDateString('fr-FR');
}

export function AdminClientDetail() {
    const { id } = useParams();
    const clientId = Number(id);
    const invalidId = !Number.isInteger(clientId) || clientId <= 0;
    const [details, setDetails] = useState<ClientDetails | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [interventions, setInterventions] = useState<InterventionListItem[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '' });
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        if (invalidId) return;
        let cancelled = false;
        getClientDetails(clientId)
            .then(data => { if (!cancelled) setDetails(data); })
            .catch(err => { if (!cancelled) setError((err as Error).message); });
        return () => { cancelled = true; };
    }, [clientId, invalidId]);

    const loadHistory = useCallback(async (offset: number) => {
        setHistoryLoading(true);
        setHistoryError(null);
        try {
            const result = await getAllInterventions({ client_id: clientId, sort: 'desc', limit: HISTORY_PAGE_SIZE, offset });
            setInterventions(prev => (offset === 0 ? result.interventions : [...prev, ...result.interventions]));
            setHasMore(result.hasMore);
        } catch (err) {
            setHistoryError((err as Error).message);
        } finally {
            setHistoryLoading(false);
        }
    }, [clientId]);

    useEffect(() => {
                if (!invalidId) loadHistory(0);
    }, [invalidId, loadHistory]);

    function startEdit() {
        if (!details) return;
        setForm({ name: details.client.name, email: details.client.email, phone: details.client.phone ?? '' });
        setSaveError(null);
        setEditing(true);
    }

    async function handleSave(e: SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        setSaving(true);
        setSaveError(null);
        try {
            const { user } = await updateUserByAdmin(clientId, {
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
            });
            setDetails(prev => (prev ? { ...prev, client: { ...prev.client, ...user } } : prev));
            setEditing(false);
        } catch (err) {
            setSaveError((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    const backLink = <Link to="/admin/clients" className="text-sm text-gray-600 hover:underline">← Retour aux clients</Link>;

    if (invalidId || error) {
        return (
            <div className="flex flex-col gap-4">
                {backLink}
                <p className="text-sm text-red-600">{invalidId ? 'Identifiant de client invalide' : error}</p>
            </div>
        );
    }

    if (!details) {
        return <p className="text-sm text-gray-600">Chargement de la fiche...</p>;
    }

    const { client, addresses, bikes } = details;

    return (
        <div className="flex flex-col gap-6">
            {backLink}

            <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold">{client.name}</h1>
                {client.is_deleted ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">Compte supprimé</span>
                ) : client.is_active ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">Actif</span>
                ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">Désactivé</span>
                )}
            </div>

            {client.is_deleted && (
                <p className="text-sm text-gray-600">Ce compte a été supprimé à la demande du client : seules les données conservées pour l'historique des interventions sont affichées.</p>
            )}

                        <section className="bg-white border rounded-md p-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-medium">Informations</h2>
                    {!client.is_deleted && !editing && (
                        <Button size="sm" variant="outline" onClick={startEdit}>Modifier</Button>
                    )}
                </div>
                {editing ? (
                    <form onSubmit={handleSave} className="flex flex-col gap-3 max-w-xl">
                        <div className="flex flex-col gap-1">
                            <label htmlFor="client-name" className="text-sm font-medium">Nom</label>
                            <input id="client-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required maxLength={255} className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label htmlFor="client-email" className="text-sm font-medium">Adresse e-mail</label>
                            <input id="client-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required maxLength={255} className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label htmlFor="client-phone" className="text-sm font-medium">Téléphone (vide pour l'effacer)</label>
                            <input id="client-phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} maxLength={20} className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                        </div>
                        {saveError && <p className="text-sm text-red-600">{saveError}</p>}
                        <div className="flex gap-2">
                            <Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
                            <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={saving}>Annuler</Button>
                        </div>
                    </form>
                ) : (
                    <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
                        <dt className="text-gray-600">E-mail</dt>
                        <dd>{client.email}</dd>
                        <dt className="text-gray-600">Téléphone</dt>
                        <dd>{client.phone ?? '—'}</dd>
                    </dl>
                )}
            </section>

            <section className="bg-white border rounded-md p-4">
                <h2 className="font-medium mb-3">Adresses ({addresses.length})</h2>
                {addresses.length === 0 ? (
                    <p className="text-sm text-gray-600">Aucune adresse enregistrée.</p>
                ) : (
                    <ul className="flex flex-col gap-2 text-sm">
                        {addresses.map(a => (
                            <li key={a.address_id} className="flex flex-wrap items-center gap-2">
                                <span>{a.address_name}</span>
                                {a.is_default && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Par défaut</span>}
                                <span className="text-gray-500">
                                    {a.zone_name ? `Zone ${a.zone_name}${a.zone_active === false ? ' (inactive)' : ''}` : 'Hors zone'}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="bg-white border rounded-md p-4">
                <h2 className="font-medium mb-3">Vélos ({bikes.length})</h2>
                {bikes.length === 0 ? (
                    <p className="text-sm text-gray-600">Aucun vélo enregistré.</p>
                ) : (
                    <ul className="flex flex-col gap-2 text-sm">
                        {bikes.map(b => (
                            <li key={b.bike_id}>
                                <span className="font-medium">{[b.brand, b.model].filter(Boolean).join(' ') || 'Vélo sans nom'}</span>
                                <span className="text-gray-500">
                                    {[b.bike_type, b.year, b.is_electric ? 'électrique' : null].filter(Boolean).map(v => ` · ${v}`).join('')}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="bg-white border rounded-md p-4 overflow-x-auto">
                <h2 className="font-medium mb-3">Historique des interventions</h2>
                {historyError && <p className="text-sm text-red-600 mb-2">{historyError}</p>}
                {interventions.length === 0 && !historyLoading ? (
                    <p className="text-sm text-gray-600">Aucune intervention.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-600 border-b">
                                <th className="py-2 pr-3 font-medium">Date</th>
                                <th className="py-2 pr-3 font-medium">Forfait</th>
                                <th className="py-2 pr-3 font-medium">Vélo</th>
                                <th className="py-2 pr-3 font-medium">Technicien</th>
                                <th className="py-2 pr-3 font-medium">État</th>
                                <th className="py-2 font-medium"><span className="sr-only">Détail</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {interventions.map(iv => (
                                <tr key={iv.intervention_id} className="border-b last:border-0">
                                    <td className="py-2 pr-3">{formatDay(iv.day)} à {iv.start_at.slice(0, 5)}</td>
                                    <td className="py-2 pr-3">{iv.name_fee}</td>
                                    <td className="py-2 pr-3">{[iv.bike_brand, iv.bike_model].filter(Boolean).join(' ') || '—'}</td>
                                    <td className="py-2 pr-3">{iv.technician_name ?? '—'}</td>
                                    <td className="py-2 pr-3">{STATE_LABELS[iv.state] ?? iv.state}</td>
                                    <td className="py-2 text-right">
                                        <Link to={`/admin/interventions/${iv.intervention_id}`} className="text-blue-700 hover:underline">Voir</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {hasMore && (
                    <div className="flex justify-center mt-3">
                        <Button variant="outline" size="sm" onClick={() => loadHistory(interventions.length)} disabled={historyLoading}>
                            {historyLoading ? 'Chargement...' : 'Afficher plus'}
                        </Button>
                    </div>
                )}
            </section>
        </div>
    );
}