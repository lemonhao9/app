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
    fee_id: number;
    name_fee: string;
    price_fee: string;
    duration: number;
    day: string;
    start_at: string;
    ended_at: string;
    zone_id: number;
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

export async function cancelIntervention(id: number | string): Promise<{ intervention: { intervention_id: number; state: string } }> {
    return handle(await fetch(`${BASE}/interventions/${id}/cancel`, { method: 'PATCH', headers: authHeaders() }));
}

export async function reassignIntervention(id: number | string, slot_id: number): Promise<{ intervention: { intervention_id: number; state: string; slot_id: number; technician_id: number | null } }> {
    return handle(await fetch(`${BASE}/interventions/${id}/reassign`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_id }),
    }));
}

export interface AvailableSlot {
    slot_id: number;
    start_at: string;
    ended_at: string;
    available: boolean;
}

export async function getSlots(zone_id: number, fee_id: number, day: string): Promise<{ slots: AvailableSlot[] }> {
    return handle(await fetch(`${BASE}/slots?zone_id=${zone_id}&fee_id=${fee_id}&day=${day}`, { headers: authHeaders() }));
}

export interface InterventionListItem {
    intervention_id: number;
    state: string;
    total_price: string | null;
    is_paid: boolean;
    bike_id: number | null;
    bike_brand: string | null;
    bike_model: string | null;
    bike_type: string | null;
    fee_id: number;
    name_fee: string;
    duration: number;
    day: string;
    start_at: string;
    ended_at: string;
    zone_id: number;
    zone_name: string;
    client_id: number;
    client_name: string;
    technician_id: number | null;
    technician_name: string | null;
    address_name: string;
    city: string | null;
}

export interface InterventionListQuery {
    date?: string;
    start_at?: string;
    zone_id?: number;
    client_id?: number;
    bike_id?: number;
    fee_id?: number;
    sort?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
}

export async function getAllInterventions(query: InterventionListQuery): Promise<{ interventions: InterventionListItem[]; hasMore: boolean }> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== '') params.set(key, String(value));
    });
    return handle(await fetch(`${BASE}/interventions?${params.toString()}`, { headers: authHeaders() }));
}
