import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { Button } from '../components/ui/button';
import { listUsers, updateUserByAdmin, deactivateUser, activateUser, type UserListItem } from '../services/users';
import { useAuth } from '../context/useAuth';
import type { User } from '../context/AuthContext';

const PAGE_SIZE = 20;
const ROLE_LABELS: Record<User['role'], string> = {
    client: 'Client',
    technician: 'Technicien',
    admin: 'Administrateur',
};

export function AdminUtilisateurs() {
    const { user: me } = useAuth();
    const [role, setRole] = useState<User['role'] | ''>('');
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [users, setUsers] = useState<UserListItem[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<UserListItem | null>(null);
    const [form, setForm] = useState({ name: '', email: '', phone: '' });
    const [saving, setSaving] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<number | null>(null);
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

    function replaceUser(updated: UserListItem) {
        setUsers(prev => prev.map(u => (u.user_id === updated.user_id ? updated : u)));
    }

    function startEdit(u: UserListItem) {
        setEditing(u);
        setForm({ name: u.name, email: u.email, phone: u.phone ?? '' });
        setActionError(null);
    }

    async function handleSave(e: SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!editing) return;
        setSaving(true);
        setActionError(null);
        try {
            const { user } = await updateUserByAdmin(editing.user_id, {
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
            });
            replaceUser(user);
            setEditing(null);
        } catch (err) {
            setActionError((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    async function handleToggle(u: UserListItem) {
        if (u.is_active && !window.confirm(`Désactiver le compte de ${u.name} ? Il ne pourra plus se connecter tant qu'il ne sera pas réactivé.`)) return;
        setBusyId(u.user_id);
        setActionError(null);
        try {
            const { user } = u.is_active ? await deactivateUser(u.user_id) : await activateUser(u.user_id);
            replaceUser(user);
        } catch (err) {
            setActionError((err as Error).message);
        } finally {
            setBusyId(null);
        }
    }

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

            {editing && (
                <form onSubmit={handleSave} className="flex flex-col gap-3 bg-white border border-blue-200 rounded-md p-4 max-w-xl">
                    <h2 className="font-medium">Modifier {editing.name} <span className="text-gray-500 font-normal">({ROLE_LABELS[editing.role]})</span></h2>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="edit-name" className="text-sm font-medium">Nom</label>
                        <input id="edit-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required maxLength={255} className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="edit-email" className="text-sm font-medium">Adresse e-mail</label>
                        <input id="edit-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required maxLength={255} className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="edit-phone" className="text-sm font-medium">Téléphone (vide pour l'effacer)</label>
                        <input id="edit-phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} maxLength={20} className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                    </div>
                    <p className="text-xs text-gray-500">Le rôle d'un compte ne peut pas être modifié.</p>
                    {actionError && <p className="text-sm text-red-600">{actionError}</p>}
                    <div className="flex gap-2">
                        <Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
                        <Button type="button" variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
                    </div>
                </form>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
            {actionError && !editing && <p className="text-sm text-red-600">{actionError}</p>}

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
                                <th className="py-2 pr-3 font-medium">État</th>
                                <th className="py-2 font-medium"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => {
                                const isMe = u.user_id === me?.user_id;
                                return (
                                    <tr key={u.user_id} className="border-b last:border-0">
                                        <td className="py-2 pr-3">{u.name}</td>
                                        <td className="py-2 pr-3">{u.email}</td>
                                        <td className="py-2 pr-3">{u.phone ?? '—'}</td>
                                        <td className="py-2 pr-3">{ROLE_LABELS[u.role]}</td>
                                        <td className="py-2 pr-3">
                                            {u.is_deleted ? (
                                                <span className="text-gray-400">Supprimé</span>
                                            ) : !u.is_active ? (
                                                <span className="text-gray-500">Désactivé</span>
                                            ) : u.must_change_password ? (
                                                <span className="text-amber-700">Mot de passe provisoire en attente</span>
                                            ) : (
                                                <span className="text-green-700">Actif</span>
                                            )}
                                        </td>
                                        <td className="py-2">
                                            {!u.is_deleted && (
                                                <div className="flex gap-2 justify-end">
                                                    <Button size="sm" variant="outline" onClick={() => startEdit(u)}>Modifier</Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={busyId !== null || (isMe && u.is_active)}
                                                        title={isMe && u.is_active ? 'Vous ne pouvez pas désactiver votre propre compte' : undefined}
                                                        onClick={() => handleToggle(u)}
                                                    >
                                                        {busyId === u.user_id ? '...' : u.is_active ? 'Désactiver' : 'Réactiver'}
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
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
