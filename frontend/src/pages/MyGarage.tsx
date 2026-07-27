import { Button } from '@/components/ui/button';
import { useEffect, useState, type SyntheticEvent } from 'react';
interface Bike {
    bike_id: number;
    brand: string | null;
    model: string | null;
    year: number | null;
    bike_type: string | null;
    is_electric: boolean | null;
    photo: string | null;
}

const BIKE_TYPES = ['VTT', 'VTC', 'Route', 'Ville', 'Pliant', 'BMX', 'Enfant', 'Cargo-Triporteur'];

function BikeForm({ bike, onSaved, onCancel }: { bike?: Bike; onSaved: (bike: Bike) => void; onCancel: () => void }) {
    const [brand, setBrand] = useState(bike?.brand ?? '');
    const [model, setModel] = useState(bike?.model ?? '');
    const [year, setYear] = useState(bike?.year ? String(bike.year) : '');
    const [bikeType, setBikeType] = useState(bike?.bike_type ?? '');
    const [isElectric, setIsElectric] = useState(bike?.is_electric ?? false);
    const [photo, setPhoto] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const formData = new FormData();
        if (brand) formData.append('brand', brand);
        if (model) formData.append('model', model);
        if (year) formData.append('year', year);
        if (bikeType) formData.append('bike_type', bikeType);
        formData.append('is_electric', String(isElectric));
        if (photo) formData.append('photo', photo);

        try {
            const token = localStorage.getItem('hch_token');
            const url = bike ? `/api/v1/bikes/${bike.bike_id}` : '/api/v1/bikes';
            const method = bike ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) {
                setError(typeof data.error === 'string' ? data.error : 'Impossible d\'ajouter le vélo.');
                return;
            }
            onSaved(data.bike);
        } catch {
            setError('Une erreur est survenue.');
        } finally {
            setLoading(false)
        }
    }
    return (
        <form onSubmit={handleSubmit} className="border rounded-xl p-5 bg-white flex flex-col gap-3 mb-6 max-w-sm">
            <input placeholder="Marque" value={brand} onChange={e => setBrand(e.target.value)} className="border rounded-md px-3 py-2 text-sm" />
            <input placeholder="Modèle" value={model} onChange={e => setModel(e.target.value)} className="border rounded-md px-3 py-2 text-sm" />
            <input type="number" placeholder="Année" value={year} onChange={e => setYear(e.target.value)} className="border rounded-md px-3 py-2 text-sm" />
            <select value={bikeType} onChange={e => setBikeType(e.target.value)} className="border rounded-md px-3 py-2 text-sm">
                <option value="">Type de vélo</option>
                {BIKE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isElectric} onChange={e => setIsElectric(e.target.checked)} />
                Électrique
            </label>
            <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] ?? null)} className="text-sm" />
            {bike?.photo && !photo && <p className="text-sm text-gray-500">Photo actuelle conservée si vous n'en choisissez pas une nouvelle</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
                <Button type="submit" disabled={loading}>{loading ? 'Enregistrement...' : (bike ? 'Enregistrer' : 'Ajouter le vélo à mon garage')}</Button>
                {bike && <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>}
            </div>
        </form>
    );
}

export function MyGarage() {
    const [bikes, setBikes] = useState<Bike[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingBikeId, setEditingBikeId] = useState<number | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('hch_token');
        if (!token) return;
        setLoading(true);
        setError(null);
        fetch('/api/v1/bikes/me', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => { if (!res.ok) throw new Error(); return res.json(); })
            .then(data => setBikes(data.bikes))
            .catch(() => setError('Impossible de charger vos vélos.'))
            .finally(() => setLoading(false));
    }, []);

    function handleUpdated(updated: Bike) {
        setBikes(prev => prev.map(b => b.bike_id === updated.bike_id ? updated : b));
        setEditingBikeId(null);
    }

    async function handleDelete(bikeId: number) {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce vélo ?')) return;
        const token = localStorage.getItem('hch_token');
        const res = await fetch(`/api/v1/bikes/${bikeId}`,
            { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        setBikes(prev => prev.filter(b => b.bike_id !== bikeId));
    }

    return (
        <main className="px-8 pt-24 pb-10 max-w-[1400px] mx-auto">
            <h1 className="text-2xl font-black uppercase tracking-wide mb-6">Mon garage</h1>

            <Button onClick={() => setShowForm(v => !v)}>{showForm ? 'Annuler' : 'Ajouter un vélo'}</Button>
            {showForm && <BikeForm onSaved={(bike) => { setBikes(prev => [...prev, bike]); setShowForm(false); }} onCancel={() => setShowForm(false)} />}

            {loading && <p className="text-sm text-gray-500">Chargement de vos vélos...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && !error && bikes.length === 0 && (
                <p className="text-sm text-gray-500">Vous n'avez pas encore de vélo enregistré.</p>
            )}

            {!loading && !error && bikes.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {bikes.map(bike => editingBikeId === bike.bike_id ? (
                        <BikeForm key={bike.bike_id} bike={bike} onSaved={handleUpdated} onCancel={() => setEditingBikeId(null)} />
                    ) : (
                        <div key={bike.bike_id} className="border rounded-xl p-5 bg-white flex flex-col gap-1">
                            {bike.photo && <img src={bike.photo} alt={`${bike.bike_type}`} className="w-full h-32 object-cover rounded-md mb-2" />}
                            <p className="font-bold text-sm">{bike.brand} {bike.model}</p>
                            <p className="text-xs text-gray-600">{bike.bike_type} {bike.year ? `· ${bike.year}` : ''}</p>
                            {bike.is_electric && <p className="text-xs text-gray-600 font-semibold">Électrique</p>}
                            <Button variant="outline" className="mt-2" onClick={() => setEditingBikeId(bike.bike_id)}>Modifier</Button>
                            <Button variant="outline" className="mt-2" onClick={() => handleDelete(bike.bike_id)}>Supprimer</Button>
                        </div>
                    )
                    )}
                </div>
            )}
        </main>
    );
}