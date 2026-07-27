import { useEffect, useState, type SyntheticEvent } from "react";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface Address {
    address_id: number;
    address_name: string;
    city: string;
    postal_code: string;
    is_default: boolean;
}

export function Profil() {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    const [addresses, setAddresses] = useState<Address[]>([]);

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
            const token = localStorage.getItem('hch_token');
            const res = await fetch('/api/v1/users/me', {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) {
                setError(typeof data.error === 'string' ? data.error : 'Impossible de mettre à jour le profil.');
                return;
            }
            updateUser(data.user);
        } catch {
            setError('Une erreur est survenue.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const token = localStorage.getItem('hch_token');
        if (!token) return;
        fetch('/api/v1/addresses/me', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => setAddresses(data.addresses))
            .catch(() => { });
    }, []);

    if (!user) return null;

    return (

        <div className="p-6 rounded shadow-md w-80">
            <h1 className="text-center">Profil</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <p>Email: {user.email}</p>
                <input value={name} onChange={e => setName(e.target.value)} className="border rounded-md px-3 py-2 text-sm" />
                <input value={phone} onChange={e => setPhone(e.target.value)} className="border rounded-md px-3 py-2 text-sm" />
                <input type="file" accept="image/*" onChange={e => setPicture(e.target.files?.[0] ?? null)} className="text-sm" />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </form>
            <p>Adresse : {addresses.find(a => a.is_default)?.address_name ?? '___'}</p>
            <div className="flex flex-col gap-4 mt-4">
                <Button onClick={() => { navigate('/reserver') }}>Prendre un rendez-vous</Button>
                <Button onClick={logout} className="bg-red-900">Se déconnecter</Button>
            </div>
        </div>
    );
}
