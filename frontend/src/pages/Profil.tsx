import { useState, type SyntheticEvent } from "react";
import { Button } from "../components/ui/button";
import { useAuth } from '@/context/useAuth';
import { useNavigate } from "react-router-dom";
import { AddressManager } from "../components/AddressManager";
import { updateMe, deleteMyAccount } from "../services/users";

export function Profil() {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState(user?.name ?? '');
    const [phone, setPhone] = useState(user?.phone ?? '');
    const [picture, setPicture] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const formData = new FormData();
        if (name) formData.append('name', name);
        if (phone) formData.append('phone', phone);
        if (picture) formData.append('picture', picture);

        try {
            const data = await updateMe(formData);
            updateUser(data.user);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteAccount() {
        if (!window.confirm('Supprimer définitivement votre compte ? Vos rendez-vous à venir seront annulés et vos données effacées. Cette action est irréversible.')) return;
        setError(null);
        try {
            await deleteMyAccount();
            logout();
            navigate('/');
        } catch (err) {
            setError((err as Error).message);
        }
    }

    if (!user) return null;

    return (
        <div className="p-6 rounded shadow-md w-full max-w-xl">
            <h1 className="text-center">Profil</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <p>Email: {user.email}</p>
                <input value={name} onChange={e => setName(e.target.value)} className="border rounded-md px-3 py-2 text-sm" />
                <input value={phone} onChange={e => setPhone(e.target.value)} className="border rounded-md px-3 py-2 text-sm" />
                <input type="file" accept="image/*" onChange={e => setPicture(e.target.files?.[0] ?? null)} className="text-sm" />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </form>
            {user.role === 'client' && <AddressManager />}
            <div className="flex flex-col gap-4 mt-4">
                <Button onClick={() => { navigate('/reserver') }}>Prendre un rendez-vous</Button>
                <Button onClick={logout} className="bg-red-900">Se déconnecter</Button>
                {user.role === 'client' && (
                    <Button variant="destructive" onClick={handleDeleteAccount}>Supprimer mon compte</Button>
                )}
            </div>
        </div>
    );
}