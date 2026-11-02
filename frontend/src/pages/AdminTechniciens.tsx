import { useState, type SyntheticEvent } from 'react';
import { Button } from '../components/ui/button';
import { createTechnician, type CreatedTechnician } from '../services/users';

export function AdminTechniciens() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [created, setCreated] = useState<CreatedTechnician | null>(null);
    const [copied, setCopied] = useState(false);

    async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const result = await createTechnician({ name, email, phone: phone.trim() || undefined });
            setCreated(result);
            setCopied(false);
            setName(''); setEmail(''); setPhone('');
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleCopy() {
        if (!created) return;
        try {
            await navigator.clipboard.writeText(created.temporaryPassword);
            setCopied(true);
        } catch {
            setError('Copie impossible : sélectionnez le mot de passe et copiez-le manuellement.');
        }
    }

    return (
        <div className="flex flex-col gap-6 max-w-xl">
            <h1 className="text-2xl font-bold">Techniciens</h1>

            {created && (
                <div className="border border-amber-300 bg-amber-50 rounded-md p-4 flex flex-col gap-3">
                    <p className="text-sm font-medium">Compte créé pour {created.user.name} ({created.user.email})</p>
                    <div className="flex items-center gap-2">
                        <code className="font-mono text-lg tracking-wider bg-white border rounded px-3 py-1 select-all">{created.temporaryPassword}</code>
                        <Button size="sm" variant="outline" onClick={handleCopy}>{copied ? 'Copié' : 'Copier'}</Button>
                    </div>
                    <p className="text-sm text-amber-900">
                        Ce mot de passe provisoire ne sera plus jamais affiché. Transmettez-le au technicien :
                        il devra le remplacer à sa première connexion, dans les 72 heures.
                    </p>
                    <Button size="sm" onClick={() => setCreated(null)}>J'ai transmis le mot de passe</Button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 bg-white border rounded-md p-4">
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
        </div>
    );
}
