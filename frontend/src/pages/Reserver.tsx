import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, GeoJSON as GeoJsonLayer } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

interface Bike {
    bike_id: number;
    brand: string | null;
    model: string | null;
    year: number | null;
    bike_type: string | null;
    is_electric: boolean | null;
}

interface Fee {
    fee_id: number;
    name_fee: string;
    price_fee: string;
    duration: number;
}

interface Address {
    address_id: number;
    address_name: string;
    city: string | null;
    longitude: number;
    latitude: number;
    is_default: boolean;
    zone_id: number | null;
}

interface Slot {
    slot_id: number;
    start_at: string;
    ended_at: string;
    available: boolean;
}

interface ZoneInfo {
    zone_id: number;
    name: string;
    color: string | null;
    geojson: GeoJSON.Feature;
}

interface Product {
    product_id: number;
    name: string;
    category: string;
    price: string;
}

interface Intervention {
    intervention_id: number;
    state: string;
    total_price: string | null;
}

const MAX_STEP = 5;

function formatDuration(minutes: number): string {
    if (minutes === 45) return "30-45 minutes";
    if (minutes >= 60) return `${Math.floor(minutes / 60)}h`;
    return `${minutes} minutes`;
}

function formatTime(time: string): string {
    return time.slice(0, 5);
}

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

function maxBookableDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 13);
    return d.toISOString().slice(0, 10);
}

function BikeStep({ selectedBikeId, onSelect }: { selectedBikeId: number | null; onSelect: (id: number) => void }) {
    const [bikes, setBikes] = useState<Bike[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('hch_token');
        if (!token) return;
        setLoading(true);
        fetch('/api/v1/bikes/me', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => { if (!res.ok) throw new Error(); return res.json(); })
            .then(data => setBikes(data.bikes))
            .catch(() => setError('Impossible de charger vos vélos.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p className="text-sm text-gray-500">Chargement de vos vélos...</p>;
    if (error) return <p className="text-sm text-red-600">{error}</p>;

    if (bikes.length === 0) {
        return (
            <div className="border rounded-md px-3 py-2 text-sm text-gray-600 bg-gray-50">
                Vous n'avez pas encore de vélo enregistré.{' '}
                <Link to="/my-garage" className="text-blue-600 underline">Ajoutez-en un dans votre garage</Link>.
            </div>
        );
    }

    return (
        <select
            value={selectedBikeId ?? ''}
            onChange={(e) => onSelect(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
            <option value="" disabled>Choisissez un vélo</option>
            {bikes.map(bike => (
                <option key={bike.bike_id} value={bike.bike_id}>
                    {bike.brand} {bike.model} {bike.bike_type ? `(${bike.bike_type})` : ''}
                </option>
            ))}
        </select>
    );
}

function FeeStep({ selectedFeeId, onSelect }: { selectedFeeId: number | null; onSelect: (id: number) => void }) {
    const [fees, setFees] = useState<Fee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        fetch('/api/v1/fees')
            .then(res => { if (!res.ok) throw new Error(); return res.json(); })
            .then(setFees)
            .catch(() => setError('Impossible de charger les forfaits.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p className="text-sm text-gray-500">Chargement des forfaits...</p>;
    if (error) return <p className="text-sm text-red-600">{error}</p>;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fees.map(fee => (
                <button
                    key={fee.fee_id}
                    type="button"
                    onClick={() => onSelect(fee.fee_id)}
                    className={`text-left border rounded-md px-3 py-2 text-sm transition-colors ${selectedFeeId === fee.fee_id ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                        }`}
                >
                    <p className="font-semibold">{fee.name_fee} - {parseFloat(fee.price_fee)}€</p>
                    <p className="text-xs text-gray-600">Durée : {formatDuration(fee.duration)}</p>
                </button>
            ))}
        </div>
    );
}

function SlotStep({
    feeId,
    selectedSlotId,
    initialAddressId,
    initialDay,
    onSelect,
}: {
    feeId: number | null;
    selectedSlotId: number | null;
    initialAddressId: number | null;
    initialDay: string | null;
    onSelect: (slotId: number, addressId: number, day: string, startAt: string) => void;
}) {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(initialAddressId);
    const [day, setDay] = useState(initialDay ?? todayISO());
    const [slots, setSlots] = useState<Slot[]>([]);
    const [zone, setZone] = useState<ZoneInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('hch_token');
        if (!token) return;
        fetch('/api/v1/addresses/me', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => { if (!res.ok) throw new Error(); return res.json(); })
            .then(data => {
                setAddresses(data.addresses);
                setSelectedAddressId(prev => {
                    if (prev !== null) return prev;
                    const def = data.addresses.find((a: Address) => a.is_default) ?? data.addresses[0];
                    return def ? def.address_id : prev;
                });
            })
            .catch(() => setError('Impossible de charger vos adresses.'));
    }, []);

    const selectedAddress = addresses.find(a => a.address_id === selectedAddressId) ?? null;
    const zoneId = selectedAddress?.zone_id ?? null;

    useEffect(() => {
        if (!zoneId) { setZone(null); return; }
        const token = localStorage.getItem('hch_token');
        fetch(`/api/v1/zones/${zoneId}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => { if (!res.ok) throw new Error(); return res.json(); })
            .then(data => setZone(data.zone))
            .catch(() => setZone(null));
    }, [zoneId]);

    useEffect(() => {
        if (!zoneId || !feeId) { setSlots([]); return; }
        const token = localStorage.getItem('hch_token');
        setLoading(true);
        setError(null);
        fetch(`/api/v1/slots?zone_id=${zoneId}&fee_id=${feeId}&day=${day}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => { if (!res.ok) throw new Error(); return res.json(); })
            .then(data => setSlots(data.slots))
            .catch(() => setError('Impossible de charger les créneaux.'))
            .finally(() => setLoading(false));
    }, [zoneId, feeId, day]);

    if (addresses.length === 0 && !error) {
        return <p className="text-sm text-gray-500">Chargement de vos adresses...</p>;
    }

    return (
        <div className="flex flex-col gap-3">
            <select
                value={selectedAddressId ?? ''}
                onChange={(e) => setSelectedAddressId(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
                {addresses.map(a => (
                    <option key={a.address_id} value={a.address_id}>
                        {a.address_name}{a.city ? `, ${a.city}` : ''}{a.is_default ? ' (par défaut)' : ''}
                    </option>
                ))}
            </select>

            {!zoneId && (
                <p className="text-sm text-orange-600">Cette adresse n'est associée à aucune zone d'intervention.</p>
            )}

            {zoneId && (
                <>
                    <input
                        type="date"
                        value={day}
                        min={todayISO()}
                        max={maxBookableDate()}
                        onChange={(e) => setDay(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />

                    {zone && selectedAddress && (
                        <div style={{ height: '200px' }}>
                            <MapContainer center={[selectedAddress.latitude, selectedAddress.longitude]} zoom={12} style={{ height: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                                <GeoJsonLayer key={zone.zone_id} data={zone.geojson} style={{ color: zone.color ?? '#3388ff' }} />
                            </MapContainer>
                        </div>
                    )}

                    {loading && <p className="text-sm text-gray-500">Chargement des créneaux...</p>}
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    {!loading && !error && slots.length === 0 && (
                        <p className="text-sm text-gray-500">Aucun créneau ce jour-là.</p>
                    )}
                    {!loading && slots.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                            {slots.map(slot => (
                                <button
                                    key={slot.slot_id}
                                    type="button"
                                    disabled={!slot.available}
                                    onClick={() => selectedAddressId && onSelect(slot.slot_id, selectedAddressId, day, slot.start_at)}
                                    className={`border rounded-md px-2 py-2 text-sm ${!slot.available
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : selectedSlotId === slot.slot_id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {formatTime(slot.start_at)}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function ProductsPhotosStep({
    selectedProductIds,
    onToggleProduct,
    photos,
    onPhotosChange,
}: {
    selectedProductIds: number[];
    onToggleProduct: (productId: number) => void;
    photos: File[];
    onPhotosChange: (files: File[]) => void;
}) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/v1/products')
            .then(res => { if (!res.ok) throw new Error(); return res.json(); })
            .then(setProducts)
            .catch(() => setError('Impossible de charger les produits additionnels.'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="flex flex-col gap-4">
            <div>
                <p className="text-sm font-semibold mb-1">Photos (optionnel)</p>
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => onPhotosChange(Array.from(e.target.files ?? []))}
                    className="text-sm"
                />
                {photos.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">{photos.length} photo(s) sélectionnée(s)</p>
                )}
            </div>

            <div>
                <p className="text-sm font-semibold mb-1">Produits additionnels (optionnel)</p>
                {loading && <p className="text-sm text-gray-500">Chargement...</p>}
                {error && <p className="text-sm text-red-600">{error}</p>}
                {!loading && !error && (
                    <div className="flex flex-col gap-1">
                        {products.map(p => (
                            <label key={p.product_id} className="flex items-center justify-between text-sm border rounded-md px-3 py-2 cursor-pointer">
                                <span className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedProductIds.includes(p.product_id)}
                                        onChange={() => onToggleProduct(p.product_id)}
                                    />
                                    {p.name}
                                </span>
                                <span className="font-semibold">{parseFloat(p.price).toFixed(2).replace('.', ',')}€</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function RecapStep({
    bikeId,
    feeId,
    addressId,
    day,
    startAt,
    productIds,
    photosCount,
}: {
    bikeId: number | null;
    feeId: number | null;
    addressId: number | null;
    day: string | null;
    startAt: string | null;
    productIds: number[];
    photosCount: number;
}) {
    const [bikes, setBikes] = useState<Bike[]>([]);
    const [fees, setFees] = useState<Fee[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('hch_token');
        setLoading(true);
        Promise.all([
            fetch('/api/v1/bikes/me', { headers: { Authorization: `Bearer ${token}` } }).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
            fetch('/api/v1/fees').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
            fetch('/api/v1/addresses/me', { headers: { Authorization: `Bearer ${token}` } }).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
            fetch('/api/v1/products').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
        ])
            .then(([bikesData, feesData, addressesData, productsData]) => {
                setBikes(bikesData.bikes);
                setFees(feesData);
                setAddresses(addressesData.addresses);
                setProducts(productsData);
            })
            .catch(() => setError('Impossible de charger le récapitulatif.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p className="text-sm text-gray-500">Chargement du récapitulatif...</p>;
    if (error) return <p className="text-sm text-red-600">{error}</p>;

    const bike = bikes.find(b => b.bike_id === bikeId);
    const fee = fees.find(f => f.fee_id === feeId);
    const address = addresses.find(a => a.address_id === addressId);
    const selectedProducts = products.filter(p => productIds.includes(p.product_id));
    const total = (fee ? parseFloat(fee.price_fee) : 0) + selectedProducts.reduce((sum, p) => sum + parseFloat(p.price), 0);

    return (
        <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Vélo</span>
                <span className="font-medium">{bike ? `${bike.brand} ${bike.model}` : '-'}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Forfait</span>
                <span className="font-medium">{fee ? `${fee.name_fee} (${formatDuration(fee.duration)})` : '-'}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Créneau</span>
                <span className="font-medium">{day && startAt ? `${day} à ${formatTime(startAt)}` : '-'}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Adresse</span>
                <span className="font-medium">{address ? `${address.address_name}${address.city ? `, ${address.city}` : ''}` : '-'}</span>
            </div>
            {selectedProducts.length > 0 && (
                <div className="flex flex-col gap-1 border-b pb-2">
                    <span className="text-gray-500">Produits additionnels</span>
                    {selectedProducts.map(p => (
                        <div key={p.product_id} className="flex justify-between">
                            <span>{p.name}</span>
                            <span>{parseFloat(p.price).toFixed(2).replace('.', ',')}€</span>
                        </div>
                    ))}
                </div>
            )}
            {photosCount > 0 && (
                <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Photos</span>
                    <span className="font-medium">{photosCount} photo(s) jointe(s)</span>
                </div>
            )}
            <div className="flex justify-between text-base font-bold">
                <span>Total estimé</span>
                <span>{total.toFixed(2).replace('.', ',')}€</span>
            </div>
            <p className="text-xs text-gray-400">Réglé sur place auprès du technicien, par carte ou en espèces.</p>
        </div>
    );
}

export function Reserver() {
    const { user, loading } = useAuth();
    const [step, setStep] = useState(1);
    const [selectedBikeId, setSelectedBikeId] = useState<number | null>(null);
    const [selectedFeeId, setSelectedFeeId] = useState<number | null>(null);
    const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [selectedStartAt, setSelectedStartAt] = useState<string | null>(null);
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
    const [photos, setPhotos] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [photoWarning, setPhotoWarning] = useState<string | null>(null);
    const [confirmedIntervention, setConfirmedIntervention] = useState<Intervention | null>(null);

    const canInteract = !loading && user?.role === 'client';
    const canGoNext = step === 1 ? !!selectedBikeId : step === 2 ? !!selectedFeeId : step === 3 ? !!selectedSlotId : true;
    const canSubmit = !!selectedBikeId && !!selectedFeeId && !!selectedSlotId && !!selectedAddressId;

    function toggleProduct(productId: number) {
        setSelectedProductIds(prev =>
            prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
        );
    }

    function resetTunnel() {
        setStep(1);
        setSelectedBikeId(null);
        setSelectedFeeId(null);
        setSelectedSlotId(null);
        setSelectedAddressId(null);
        setSelectedDay(null);
        setSelectedStartAt(null);
        setSelectedProductIds([]);
        setPhotos([]);
        setSubmitError(null);
        setPhotoWarning(null);
        setConfirmedIntervention(null);
    }

    async function handleConfirm() {
        if (!canSubmit) return;
        setSubmitting(true);
        setSubmitError(null);
        setPhotoWarning(null);
        const token = localStorage.getItem('hch_token');
        try {
            const res = await fetch('/api/v1/interventions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    bike_id: selectedBikeId,
                    slot_id: selectedSlotId,
                    address_id: selectedAddressId,
                    product_ids: selectedProductIds,
                }),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                if (res.status === 409) {
                    setSubmitError(data?.error ?? "Ce créneau n'est plus disponible, merci d'en choisir un autre.");
                    setSelectedSlotId(null);
                    setStep(3);
                } else {
                    setSubmitError(data?.error ?? 'Une erreur est survenue, merci de réessayer.');
                }
                return;
            }

            const intervention: Intervention = data.intervention;

            if (photos.length > 0) {
                const formData = new FormData();
                photos.forEach(file => formData.append('photos', file));
                const photoRes = await fetch(`/api/v1/interventions/${intervention.intervention_id}/photos`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                }).catch(() => null);
                if (!photoRes || !photoRes.ok) {
                    setPhotoWarning("Votre réservation est confirmée, mais l'envoi des photos a échoué. Vous pourrez les ajouter plus tard depuis le suivi d'intervention.");
                }
            }

            setConfirmedIntervention(intervention);
        } catch {
            setSubmitError('Impossible de contacter le serveur. Réessayez.');
        } finally {
            setSubmitting(false);
        }
    }

    if (confirmedIntervention) {
        return (
            <div className="flex flex-col items-center min-h-screen bg-gray-100">
                <main className="w-full max-w-xl px-4 pt-24 pb-10">
                    <section className="border rounded-xl p-6 bg-white flex flex-col gap-4 items-center text-center">
                        <h1 className="text-xl font-black uppercase tracking-wide">Réservation confirmée !</h1>
                        <p className="text-sm text-gray-600">
                            Votre intervention n°{confirmedIntervention.intervention_id} est enregistrée. Le technicien assigné vous attend au créneau choisi.
                        </p>
                        {photoWarning && <p className="text-sm text-orange-600">{photoWarning}</p>}
                        <div className="flex gap-2">
                            <Button asChild variant="outline">
                                <Link to="/">Retour à l'accueil</Link>
                            </Button>
                            <Button type="button" onClick={resetTunnel}>Réserver une autre intervention</Button>
                        </div>
                    </section>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-100">
            <main className="w-full max-w-xl px-4 pt-24 pb-10">
                <h1 className="text-2xl font-black uppercase tracking-wide mb-6">Réserver une intervention</h1>

                {!loading && !canInteract && (
                    <div className="mb-6 border border-blue-200 bg-blue-50 rounded-md px-4 py-3 text-sm text-blue-900">
                        {user ? (
                            <>Cette page est réservée aux comptes client.</>
                        ) : (
                            <>
                                Connectez-vous ou créez un compte pour réserver une intervention.{' '}
                                <Link to="/login" className="underline font-medium">Se connecter</Link>
                                {' '}·{' '}
                                <Link to="/signup" className="underline font-medium">Créer un compte</Link>
                            </>
                        )}
                    </div>
                )}

                <div className={!canInteract ? 'pointer-events-none opacity-50 select-none' : ''}>
                    <section className="border rounded-xl p-5 bg-white flex flex-col gap-3">
                        {step === 1 && (
                            <>
                                <h2 className="font-bold text-sm uppercase tracking-wide">Étape 1 - Votre vélo</h2>
                                {canInteract ? (
                                    <BikeStep selectedBikeId={selectedBikeId} onSelect={setSelectedBikeId} />
                                ) : (
                                    <select disabled className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100">
                                        <option>Choisissez un vélo</option>
                                    </select>
                                )}
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <h2 className="font-bold text-sm uppercase tracking-wide">Étape 2 - Votre forfait</h2>
                                {canInteract && (
                                    <FeeStep
                                        selectedFeeId={selectedFeeId}
                                        onSelect={(feeId) => {
                                            if (feeId !== selectedFeeId) {
                                                setSelectedSlotId(null);
                                                setSelectedAddressId(null);
                                                setSelectedDay(null);
                                                setSelectedStartAt(null);
                                            }
                                            setSelectedFeeId(feeId);
                                        }}
                                    />
                                )}
                            </>
                        )}

                        {step === 3 && (
                            <>
                                <h2 className="font-bold text-sm uppercase tracking-wide">Étape 3 - Votre créneau</h2>
                                {canInteract && (
                                    <SlotStep
                                        feeId={selectedFeeId}
                                        selectedSlotId={selectedSlotId}
                                        initialAddressId={selectedAddressId}
                                        initialDay={selectedDay}
                                        onSelect={(slotId, addressId, day, startAt) => {
                                            setSelectedSlotId(slotId);
                                            setSelectedAddressId(addressId);
                                            setSelectedDay(day);
                                            setSelectedStartAt(startAt);
                                        }}
                                    />
                                )}
                            </>
                        )}



                        {step === 4 && (
                            <>
                                <h2 className="font-bold text-sm uppercase tracking-wide">Étape 4 - Photos et produits (optionnel)</h2>
                                {canInteract && (
                                    <ProductsPhotosStep
                                        selectedProductIds={selectedProductIds}
                                        onToggleProduct={toggleProduct}
                                        photos={photos}
                                        onPhotosChange={setPhotos}
                                    />
                                )}
                            </>
                        )}

                        {step === 5 && (
                            <>
                                <h2 className="font-bold text-sm uppercase tracking-wide">Étape 5 - Récapitulatif</h2>
                                {canInteract && (
                                    <RecapStep
                                        bikeId={selectedBikeId}
                                        feeId={selectedFeeId}
                                        addressId={selectedAddressId}
                                        day={selectedDay}
                                        startAt={selectedStartAt}
                                        productIds={selectedProductIds}
                                        photosCount={photos.length}
                                    />
                                )}
                            </>
                        )}

                        <div className="flex gap-2 mt-2">
                            {step > 1 && (
                                <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} disabled={submitting}>
                                    Précédent
                                </Button>
                            )}
                            {step < MAX_STEP ? (
                                <Button
                                    type="button"
                                    disabled={!canInteract || !canGoNext}
                                    onClick={() => setStep(s => Math.min(s + 1, MAX_STEP))}
                                >
                                    Suivant
                                </Button>
                            ) : (
                                <Button type="button" disabled={!canInteract || !canSubmit || submitting} onClick={handleConfirm}>
                                    {submitting ? 'Confirmation en cours...' : 'Confirmer la réservation'}
                                </Button>
                            )}
                        </div>
                        {submitError && <p className="text-sm text-red-600">{submitError}</p>}
                    </section>
                </div>
            </main>
        </div>
    );
}
