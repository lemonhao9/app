import { useCallback, useEffect, useState, type SyntheticEvent } from 'react';
import { Button } from '../components/ui/button';
import {
    createTechnician,
    getTechnicians,
    regenerateTemporaryPassword,
    type CreatedTechnician,
    type TechnicianListItem,
} from '../services/users';

type IssuedPassword = CreatedTechnician & { reason: 'create' | 'reset' };

export function AdminTechniciens() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [issued, setIssued] = useState<IssuedPassword | null>(null);
    const [copied, setCopied] = useState(false);
    const [technicians, setTechnicians] = useState<TechnicianListItem[]>([]);
    const [listError, setListError] = useState<string | null>(null);
    const [resettingId, setResettingId] = useState<number | null>(null);

    const loadTechnicians = useCallback(async () => {
        try {
            const { users } = await getTechnicians();
            setTechnicians(users);
            setListError(null);
        } catch (err) {
            setListError((err as Error).message);
        }
    }, []);

    useEffect(() => {
        loadTechnicians();
    }, [loadTechnicians]);

    async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const result = await createTechnician({ name, email, phone: phone.trim() || undefined });
            setIssued({ ...result, reason: 'create' });
            setCopied(false);
            setName(''); setEmail(''); setPhone('');
            await loadTechnicians();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleReset(tech: TechnicianListItem) {
        if (!window.confirm(`Générer un nouveau mot de passe provisoire pour ${tech.name} ? Son mot de passe actuel cessera de fonctionner et ses sessions ouvertes seront fermées.`)) return;
        setListError(null);
        setResettingId(tech.user_id);
        try {
            const result = await regenerateTemporaryPassword(tech.user_id);
            setIssued({ ...result, reason: 'reset' });
            setCopied(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            await loadTechnicians();
        } catch (err) {
            setListError((err as Error).message);
        } finally {
            setResettingId(null);
        }
    }

    async function handleCopy() {
        if (!issued) return;
        try {
            await navigator.clipboard.writeText(issued.temporaryPassword);
            setCopied(true);
        } catch {
            setError('Copie impossible : sélectionnez le mot de passe et copiez-le manuellement.');
        }
    }

    return (
        <div className="flex flex-col gap-6 max-w-3xl">
            <h1 className="text-2xl font-bold">Techniciens</h1>

            {issued && (
                <div className="border border-amber-300 bg-amber-50 rounded-md p-4 flex flex-col gap-3">
                    <p className="text-sm font-medium">
                        {issued.reason === 'create' ? 'Compte créé pour' : 'Nouveau mot de passe provisoire pour'} {issued.user.name} ({issued.user.email})
                    </p>
                    <div className="flex items-center gap-2">
                        <code className="font-mono text-lg tracking-wider bg-white border rounded px-3 py-1 select-all">{issued.temporaryPassword}</code>
                        <Button size="sm" variant="outline" onClick={handleCopy}>{copied ? 'Copié' : 'Copier'}</Button>
                    </div>
                    <p className="text-sm text-amber-900">
                        Ce mot de passe provisoire ne sera plus jamais affiché. Transmettez-le au technicien :
                        il devra le remplacer à sa prochaine connexion, dans les 72 heures.
                    </p>
                    <Button size="sm" onClick={() => setIssued(null)}>J'ai transmis le mot de passe</Button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 bg-white border rounded-md p-4 max-w-xl">
                <h2 className="font-medium">Créer un technicien</h2>
                <div className="flex flex-col gap-1">
                    <label htmlFor="tech-name" className="text-sm font-medium">Nom</label>
                    <input id="tech-name" value={name} onChange={e => setName(e.target.value)} required maxLength={255} className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
                <div className="flex flex-col gap-1">
                    <label htmlFor="tech-email" className="text-sm font-medium">Adresse e-mail</label>
                    <input id="tech-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
                <div className="flex flex-col gap-1">
                    <label htmlFor="tech-phone" className="text-sm font-medium">Téléphone (facultatif)</label>
                    <input id="tech-phone" value={phone} onChange={e => setPhone(e.target.value)} maxLength={20} className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" disabled={submitting}>{submitting ? 'Création...' : 'Créer le compte'}</Button>
            </form>

            <section className="flex flex-col gap-3 bg-white border rounded-md p-4">
                <h2 className="font-medium">Liste des techniciens</h2>
                {listError && <p className="text-sm text-red-600">{listError}</p>}
                {technicians.length === 0 ? (
                    <p className="text-sm text-gray-600">Aucun technicien pour le moment.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-600 border-b">
                                    <th className="py-2 pr-3 font-medium">Nom</th>
                                    <th className="py-2 pr-3 font-medium">E-mail</th>
                                    <th className="py-2 pr-3 font-medium">Téléphone</th>
                                    <th className="py-2 pr-3 font-medium">État</th>
                                    <th className="py-2 font-medium"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {technicians.map(tech => (
                                    <tr key={tech.user_id} className="border-b last:border-0">
                                        <td className="py-2 pr-3">{tech.name}</td>
                                        <td className="py-2 pr-3">{tech.email}</td>
                                        <td className="py-2 pr-3">{tech.phone ?? '—'}</td>
                                        <td className="py-2 pr-3">
                                            {!tech.is_active ? (
                                                <span className="text-gray-500">Désactivé</span>
                                            ) : tech.must_change_password ? (
                                                <span className="text-amber-700">Mot de passe provisoire en attente</span>
                                            ) : (
                                                <span className="text-green-700">Actif</span>
                                            )}
                                        </td>
                                        <td className="py-2 text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={!tech.is_active || resettingId !== null}
                                                onClick={() => handleReset(tech)}
                                            >
                                                {resettingId === tech.user_id ? 'Génération...' : 'Nouveau mot de passe provisoire'}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
