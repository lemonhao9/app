import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../components/ui/button';
import { listUsers, type UserListItem } from '../services/users';
import type { User } from '../context/AuthContext';

const PAGE_SIZE = 20;
const ROLE_LABELS: Record<User['role'], string> = {
    client: 'Client',
    technician: 'Technicien',
    admin: 'Administrateur',
};

export function AdminUtilisateurs() {
    const [role, setRole] = useState<User['role'] | ''>('');
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [users, setUsers] = useState<UserListItem[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const requestId = useRef(0);

    useEffect(() => {
        const timer = setTimeout(() => setQuery(search.trim()), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const load = useCallback(async (offset: number) => {
        const id = ++requestId.current;
        setLoading(true);
        setError(null);
        try {
            const result = await listUsers({ role: role || undefined, q: query || undefined, limit: PAGE_SIZE, offset });
            if (id !== requestId.current) return;
            setUsers(prev => (offset === 0 ? result.users : [...prev, ...result.users]));
            setHasMore(result.hasMore);
        } catch (err) {
            if (id !== requestId.current) return;
            setError((err as Error).message);
        } finally {
            if (id === requestId.current) setLoading(false);
        }
    }, [role, query]);

    useEffect(() => {
        load(0);
    }, [load]);

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold">Utilisateurs</h1>

            <div className="flex flex-wrap gap-3 items-end bg-white border rounded-md p-4">
                <div className="flex flex-col gap-1">
                    <label htmlFor="user-role" className="text-sm font-medium">Rôle</label>
                    <select id="user-role" value={role} onChange={e => setRole(e.target.value as User['role'] | '')} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                        <option value="">Tous</option>
                        <option value="client">Clients</option>
                        <option value="technician">Techniciens</option>
                        <option value="admin">Administrateurs</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
                    <label htmlFor="user-search" className="text-sm font-medium">Rechercher</label>
                    <input id="user-search" type="search" value={search} onChange={e => setSearch(e.target.value)} maxLength={100} placeholder="Nom ou e-mail" className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="bg-white border rounded-md p-4 overflow-x-auto">
                {users.length === 0 && !loading ? (
                    <p className="text-sm text-gray-600">Aucun utilisateur ne correspond à ces critères.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-600 border-b">
                                <th className="py-2 pr-3 font-medium">Nom</th>
                                <th className="py-2 pr-3 font-medium">E-mail</th>
                                <th className="py-2 pr-3 font-medium">Téléphone</th>
                                <th className="py-2 pr-3 font-medium">Rôle</th>
                                <th className="py-2 font-medium">État</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.user_id} className="border-b last:border-0">
                                    <td className="py-2 pr-3">{u.name}</td>
                                    <td className="py-2 pr-3">{u.email}</td>
                                    <td className="py-2 pr-3">{u.phone ?? '—'}</td>
                                    <td className="py-2 pr-3">{ROLE_LABELS[u.role]}</td>
                                    <td className="py-2">
                                        {!u.is_active ? (
                                            <span className="text-gray-500">Inactif</span>
                                        ) : u.must_change_password ? (
                                            <span className="text-amber-700">Mot de passe provisoire en attente</span>
                                        ) : (
                                            <span className="text-green-700">Actif</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {hasMore && (
                <Button variant="outline" onClick={() => load(users.length)} disabled={loading} className="self-center">
                    {loading ? 'Chargement...' : 'Afficher plus'}
                </Button>
            )}
        </div>
    );
}