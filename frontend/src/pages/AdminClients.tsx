import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../components/ui/button';
import { listClients, type ClientListItem, type ClientStatus } from '../services/users';
import { getZones, type Zone } from '../services/zones';

const PAGE_SIZE = 20;

function pageNumbers(current: number, last: number): (number | '…')[] {
    const pages: (number | '…')[] = [];
    for (let p = 1; p <= last; p++) {
        if (p === 1 || p === last || Math.abs(p - current) <= 2) {
            pages.push(p);
        } else if (pages[pages.length - 1] !== '…') {
            pages.push('…');
        }
    }
    return pages;
}

export function AdminClients() {
    const [status, setStatus] = useState<ClientStatus | ''>('');
    const [search, setSearch] = useState('');
    const [addressSearch, setAddressSearch] = useState('');
    const [q, setQ] = useState('');
    const [address, setAddress] = useState('');
    const [zoneIds, setZoneIds] = useState<number[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [page, setPage] = useState(1);
    const [clients, setClients] = useState<ClientListItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const requestId = useRef(0);

    useEffect(() => {
        getZones()
            .then(({ zones }) => setZones([...zones].sort((a, b) => a.name.localeCompare(b.name, 'fr'))))
            .catch(() => setZones([]));
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setQ(search.trim());
            setAddress(addressSearch.trim());
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, addressSearch]);

    const load = useCallback(async () => {
        const id = ++requestId.current;
        setLoading(true);
        setError(null);
        try {
            const result = await listClients({
                status: status || undefined,
                q: q || undefined,
                address: address || undefined,
                zoneIds,
                limit: PAGE_SIZE,
                offset: (page - 1) * PAGE_SIZE,
            });
            if (id !== requestId.current) return;
            setClients(result.clients);
            setTotal(result.total);
        } catch (err) {
            if (id !== requestId.current) return;
            setError((err as Error).message);
        } finally {
            if (id === requestId.current) setLoading(false);
        }
    }, [status, q, address, zoneIds, page]);

    useEffect(() => {
        load();
    }, [load]);

    function toggleZone(zoneId: number) {
        setZoneIds(prev => (prev.includes(zoneId) ? prev.filter(z => z !== zoneId) : [...prev, zoneId]));
        setPage(1);
    }

    function resetFilters() {
        setStatus('');
        setSearch('');
        setAddressSearch('');
        setZoneIds([]);
        setPage(1);
    }

    const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold">Clients</h1>

            <div className="flex flex-col gap-4 bg-white border rounded-md p-4">
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="client-status" className="text-sm font-medium">État</label>
                        <select id="client-status" value={status} onChange={e => { setStatus(e.target.value as ClientStatus | ''); setPage(1); }} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                            <option value="">Tous</option>
                            <option value="active">Actifs</option>
                            <option value="inactive">Désactivés</option>
                            <option value="deleted">Supprimés</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                        <label htmlFor="client-search" className="text-sm font-medium">Rechercher</label>
                        <input id="client-search" type="search" value={search} onChange={e => setSearch(e.target.value)} maxLength={100} placeholder="Nom, e-mail ou téléphone" className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                        <label htmlFor="client-address" className="text-sm font-medium">Adresse</label>
                        <input id="client-address" type="search" value={addressSearch} onChange={e => setAddressSearch(e.target.value)} maxLength={100} placeholder="Rue, ville ou code postal" className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                    </div>
                    <Button type="button" variant="outline" onClick={resetFilters}>Réinitialiser</Button>
                </div>

                {zones.length > 0 && (
                    <fieldset>
                        <legend className="text-sm font-medium mb-1">
                            Zones {zoneIds.length > 0 && <span className="text-gray-500 font-normal">({zoneIds.length} sélectionnée{zoneIds.length > 1 ? 's' : ''})</span>}
                        </legend>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 max-h-36 overflow-y-auto border border-gray-200 rounded-md p-2">
                            {zones.map(zone => (
                                <label key={zone.zone_id} className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={zoneIds.includes(zone.zone_id)} onChange={() => toggleZone(zone.zone_id)} />
                                    <span className={zone.is_active ? '' : 'text-gray-400'}>{zone.name}{!zone.is_active && ' (inactive)'}</span>
                                </label>
                            ))}
                        </div>
                    </fieldset>
                )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="bg-white border rounded-md p-4 overflow-x-auto">
                <p className="text-sm text-gray-600 mb-3" aria-live="polite">
                    {loading ? 'Chargement...' : `${total} client${total > 1 ? 's' : ''}`}
                </p>
                {clients.length === 0 && !loading ? (
                    <p className="text-sm text-gray-600">Aucun client ne correspond à ces critères.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-600 border-b">
                                <th className="py-2 pr-3 font-medium">État</th>
                                <th className="py-2 pr-3 font-medium">Nom</th>
                                <th className="py-2 pr-3 font-medium">Vélos</th>
                                <th className="py-2 pr-3 font-medium">Zone</th>
                                <th className="py-2 pr-3 font-medium">Adresse</th>
                                <th className="py-2 pr-3 font-medium">Téléphone</th>
                                <th className="py-2 font-medium">E-mail</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map(c => (
                                <tr key={c.user_id} className="border-b last:border-0">
                                    <td className="py-2 pr-3">
                                        {c.is_deleted ? (
                                            <span className="text-gray-400">Supprimé</span>
                                        ) : c.is_active ? (
                                            <span className="text-green-700">Actif</span>
                                        ) : (
                                            <span className="text-gray-500">Désactivé</span>
                                        )}
                                    </td>
                                    <td className="py-2 pr-3">{c.name}</td>
                                    <td className="py-2 pr-3">{c.bike_count}</td>
                                    <td className="py-2 pr-3">{c.zone_name ?? '—'}</td>
                                    <td className="py-2 pr-3">{c.address_name ?? '—'}</td>
                                    <td className="py-2 pr-3">{c.phone ?? '—'}</td>
                                    <td className="py-2">{c.email}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {lastPage > 1 && (
                <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
                    <Button size="sm" variant="outline" disabled={page === 1 || loading} onClick={() => setPage(p => p - 1)} aria-label="Page précédente">‹</Button>
                    {pageNumbers(page, lastPage).map((p, i) =>
                        p === '…' ? (
                            <span key={`gap-${i}`} className="px-2 text-gray-500">…</span>
                        ) : (
                            <Button key={p} size="sm" variant={p === page ? 'default' : 'outline'} disabled={loading} onClick={() => setPage(p)} aria-current={p === page ? 'page' : undefined}>
                                {p}
                            </Button>
                        )
                    )}
                    <Button size="sm" variant="outline" disabled={page === lastPage || loading} onClick={() => setPage(p => p + 1)} aria-label="Page suivante">›</Button>
                </nav>
            )}
        </div>
    );
}
