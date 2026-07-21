import { useEffect, useState } from 'react';
import { NavBar } from '../components/ui/NavBar';

interface Bike {
    bike_id: number;
    brand: string | null;
    model: string | null;
    year: number | null;
    bike_type: string | null;
    is_electric: boolean | null;
}

export function MyGarage() {
    const [bikes, setBikes] = useState<Bike[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('hch_token');
        if (!token) return;
        setLoading(true);
        setError(null);
        fetch('/api/v1/bikes/me', { headers: { Authorization: `Bearer ${token}` }})
            .then(res => { if (!res.ok) throw new Error(); return res.json(); })
            .then(data => setBikes(data.bikes))
            .catch(() => setError('Impossible de charger vos vélos.'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar dark />
            <main className="px-8 pt-24 pb-10 max-w-[1400px] mx-auto">
                <h1 className="text-2xl font-black uppercase tracking-wide mb-6">Mon garage</h1>

                {loading && <p className="text-sm text-gray-500">Chargement de vos vélos...</p>}
                {error && <p className="text-sm text-red-600">{error}</p>}
            
                {!loading && !error && bikes.length === 0 && (
                    <p className="text-sm text-gray-500">Vous n'avez pas encore de vélo enregistré.</p>
                )}

                {!loading && !error && bikes.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {bikes.map(bike => (
                            <div key={bike.bike_id} className="border rounded-xl p-5 bg-white flex flex-col gap-1">
                                <p className="font-bold text-sm">{bike.brand} {bike.model}</p>
                                <p className="text-xs text-gray-600">{bike.bike_type} {bike.year? `· ${bike.year}` : ''}</p>
                                {bike.is_electric && <p className="text-xs text-gray-600 font-semibold">Électrique</p>}
                            </div>
                        ))} 
                    </div>
                )}
            </main>
        </div>
    );
}