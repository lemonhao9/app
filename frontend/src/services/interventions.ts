const BASE = '/api/v1';

function authHeaders(): HeadersInit {
    const token = localStorage.getItem('hch_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res: Response) {
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Erreur');
    return res.json();
}

export interface InterventionDetail {
    intervention_id: number;
    state: string;
    total_price: string | null;
    is_paid: boolean;
    client_name: string | null;
    client_phone: string | null;
    client_email: string;
    technician_name: string | null;
    technician_phone: string | null;
    technician_email: string | null;
    bike_brand: string | null;
    bike_model: string | null;
    bike_type: string | null;
    bike_year: number | null;
    is_electric: boolean;
    name_fee: string;
    price_fee: string;
    duration: number;
    day: string;
    start_at: string;
    ended_at: string;
    zone_name: string;
    address_name: string;
    city: string | null;
    postal_code: string | null;
    products: { product_id: number; name: string; category: string | null; price: string; quantity: number }[];
    photos: { photo_id: number; url: string; created_at: string }[];
}

export async function getInterventionDetail(id: number | string): Promise<{ intervention: InterventionDetail }> {
    return handle(await fetch(`${BASE}/interventions/${id}`, { headers: authHeaders() }));
}
