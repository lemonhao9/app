import { useState, type SyntheticEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export function TechnicianProfil() {
    const { user, updateUser } = useAuth();
    const [name, setName] = useState(user?.name ?? '');
    const [phone, setPhone] = useState(user?.phone ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!user) return null;

    async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        const body: Record<string, string> = {};
        if (name && name !== user!.name) body.name = name;
        if (phone && phone !== user!.phone) body.phone = phone;
        if (email && email !== user!.email) body.email = email;
        if (newPassword) {
            body.newPassword = newPassword;
            body.currentPassword = currentPassword;
        }

        try {
            const token = localStorage.getItem('hch_token');
            const res = await fetch('/api/v1/users/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(typeof data.error === 'string' ? data.error : 'Impossible de mettre à jour vos informations.');
                return;
            }
            updateUser(data.user);
            setCurrentPassword('');
            setNewPassword('');
            setSuccess(true);
        } catch {
            setError('Une erreur est survenue.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="border rounded-xl p-6 bg-white max-w-md flex flex-col gap-4">
            <h1 className="text-xl font-black uppercase tracking-wide">Mes informations</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <label className="text-sm flex flex-col gap-1">
                    Nom
                    <input value={name} onChange={e => setName(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </label>
                <label className="text-sm flex flex-col gap-1">
                    Email
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </label>
                <label className="text-sm flex flex-col gap-1">
                    Téléphone
                    <input value={phone} onChange={e => setPhone(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </label>

                <div className="border-t pt-3 flex flex-col gap-3">
                    <p className="text-sm font-semibold">Changer de mot de passe (optionnel)</p>
                    <label className="text-sm flex flex-col gap-1">
                        Mot de passe actuel
                        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                    </label>
                    <label className="text-sm flex flex-col gap-1">
                        Nouveau mot de passe
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                    </label>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
                {success && <p className="text-sm text-green-600">Informations mises à jour.</p>}
                <Button type="submit" disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </form>
        </div>
    );
}
