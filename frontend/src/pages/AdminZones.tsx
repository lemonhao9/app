import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import type L from 'leaflet';
import { GeomanLayer, type GeomanLayerHandle } from '../components/GeomanLayer';
import { getZones, createZone, deactivateZone, getZoneTechnicians, getTechnicians, assignTechnician, unassignTechnician, updateZone, type Zone, type Technician } from '../services/zones';
import { Button } from '../components/ui/button';

export function AdminZones() {
    const [zones, setZones] = useState<Zone[]>([]);
    const [pending, setPending] = useState<{ geojson: GeoJSON.Feature; bounds: L.LatLngBounds } | null>(null);
    const [name, setName] = useState('');
    const [color, setColor] = useState('#3388ff');
    const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
    const [assignedTechnicians, setAssignedTechnicians] = useState<Technician[]>([]);
    const [allTechnicians, setAllTechnicians] = useState<Technician[]>([]);
    const [selectedTechnicianId, setSelectedTechnicianId] = useState<number | null>(null);
    const activeZones = zones.filter(z => z.is_active);
    const geomanRef = useRef<GeomanLayerHandle>(null);
    const [editingZoneId, setEditingZoneId] = useState<number | null>(null);

    const refresh = useCallback(() => { getZones().then(({ zones }) => setZones(zones)); }, []);
    useEffect(() => { refresh(); }, [refresh]);

    const handleCreate = useCallback((geojson: GeoJSON.Feature, bounds: L.LatLngBounds) => {
        setPending({ geojson, bounds });
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!pending) return;
        const center = pending.bounds.getCenter();
        await createZone({ name, color, latitude: center.lat, longitude: center.lng, geojson: pending.geojson });
        geomanRef.current?.clearPending();
        setPending(null);
        setName('');
        refresh();
    };

    async function handleDeactivate(id: number) {
        await deactivateZone(id);
        refresh();
    }

    useEffect(() => { getTechnicians().then(({ users }) => setAllTechnicians(users)); }, []);

    const refreshAssigned = useCallback((zoneId: number) => {
        getZoneTechnicians(zoneId).then(({ technicians }) => setAssignedTechnicians(technicians));
    }, []);

    useEffect(() => {
        if (selectedZoneId) refreshAssigned(selectedZoneId);
        else setAssignedTechnicians([]);
    }, [selectedZoneId, refreshAssigned]);

    const avaibleTechnicians = allTechnicians.filter(
        t => !assignedTechnicians.some(a => a.user_id === t.user_id)
    );

    async function handleAssign() {
        if (!selectedZoneId || !selectedTechnicianId) return;
        await assignTechnician(selectedZoneId, selectedTechnicianId);
        setSelectedTechnicianId(null);
        refreshAssigned(selectedZoneId);
    }

    async function handleUnassign(userId: number) {
        if (!selectedZoneId) return;
        await unassignTechnician(selectedZoneId, userId);
        refreshAssigned(selectedZoneId);
    }

    async function handleSaveEdit() {
        if (!editingZoneId) return;
        const result = geomanRef.current?.getEditedGeoJSON(editingZoneId);
        const zone = zones.find(z => z.zone_id === editingZoneId);
        if (!result || !zone) return;
        const center = result.bounds.getCenter();
        await updateZone(editingZoneId, { name: zone.name, color: zone.color ?? undefined, latitude: center.lat, longitude: center.lng, geojson: result.geojson });
        setEditingZoneId(null);
        refresh();
    }

    function handleCancelEdit() {
        setEditingZoneId(null);
    }

    return (
        <>
        <h1 className="text-2xl font-bold mb-6 text-center">Gestion des zones</h1>
        <div className="flex gap-8">
            <aside className="w-64 shrink-0 flex flex-col gap-6">
                <div>
                    <h2 className="font-semibold mb-2">Nouvelle zone</h2>
                    {pending ? (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                            <label className="flex flex-col text-sm">Nom
                                <input value={name} onChange={e => setName(e.target.value)} />
                            </label>
                            <label className="flex flex-col text-sm">Couleur
                                <input type="color" value={color} onChange={e => setColor(e.target.value)} />
                            </label>
                            <div className="flex gap-2">
                                <Button type="submit">Créer la zone</Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => { geomanRef.current?.clearPending(); setPending(null); }}
                                >
                                    Annuler
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <p className="text-sm text-gray-500">Dessinez une zone sur la carte pour la créer.</p>
                    )}
                </div>

                <div>
                    <h2 className="font-semibold mb-2">Assignation des techniciens</h2>
                    <select
                        value={selectedZoneId ?? ''}
                        onChange={e => setSelectedZoneId(Number(e.target.value) || null)}
                        className="border px-2 py-1 text-sm w-full mb-2"
                    >
                        <option value="">Choisir une zone…</option>
                        {activeZones.map(zone => (
                            <option key={zone.zone_id} value={zone.zone_id}>{zone.name}</option>
                        ))}
                    </select>

                    {selectedZoneId ? (
                        <>
                            <ul className="space-y-1 mb-2">
                                {assignedTechnicians.map(t => (
                                    <li key={t.user_id} className="flex items-center justify-between text-sm">
                                        <span>{t.name}</span>
                                        <Button variant="destructive" size="sm" onClick={() => handleUnassign(t.user_id)}>Désassigner</Button>
                                    </li>
                                ))}
                                {assignedTechnicians.length === 0 && <li className="text-sm text-gray-500">Aucun technicien assigné</li>}
                            </ul>
                            <div className="flex gap-2">
                                <select value={selectedTechnicianId || ''} onChange={e => setSelectedTechnicianId(Number(e.target.value) || null)} className="border px-2 py-1 text-sm">
                                    <option value="">Sélectionner un technicien</option>
                                    {avaibleTechnicians.map(t => (
                                        <option key={t.user_id} value={t.user_id}>{t.name}</option>
                                    ))}
                                </select>
                                <Button onClick={handleAssign} disabled={!selectedTechnicianId} size="sm">Assigner</Button>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-gray-500">Sélectionnez une zone pour gérer ses techniciens.</p>
                    )}
                </div>
            </aside>


            <div className="flex-1">
                <MapContainer center={[45.7640, 4.8357]} zoom={13} style={{ height: '450px' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                    <GeomanLayer ref={geomanRef} zones={activeZones} editingZoneId={editingZoneId} onCreate={handleCreate} />
                </MapContainer>
                {editingZoneId && (
                    <div className="mt-2 flex gap-2 items-center">
                        <span className="text-sm text-gray-600">Modifications en cours...</span>
                        <Button size="sm" onClick={handleSaveEdit}>Enregistrer</Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>Annuler</Button>
                        </div>
                        )}
            </div>

            <aside className="w-64 shrink-0">
                <h2 className="font-semibold mb-2">Liste des zones actives</h2>
                <ul className="space-y-1">
                    {activeZones.map(zone => (
                        <li
                            key={zone.zone_id}
                            onClick={() => setSelectedZoneId(zone.zone_id)}
                            className={`flex items-center justify-between text-sm px-2 py-1 rounded cursor-pointer ${selectedZoneId === zone.zone_id ? 'bg-gray-200' : ''}`}
                        >
                            <span style={{ color: zone.color || undefined }}>{zone.name}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); setEditingZoneId(zone.zone_id); }}
                            >
                                Modifier
                            </Button>

                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleDeactivate(zone.zone_id); }}
                            >
                                Désactiver
                            </Button>
                        </li>
                    ))}
                </ul>
            </aside>
        </div>
        </>
    );
}