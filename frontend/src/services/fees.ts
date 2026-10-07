const BASE = '/api/v1';

function authHeaders(): HeadersInit {
    const token = localStorage.getItem('hch_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res: Response) {
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Erreur');
    return res.json();
}

export interface Fee {
    fee_id: number;
    name_fee: string;
    price_fee: string;
    description_forfait: string | null;
    duration: number;
    optional_title: string | null;
    optional_price: string | null;
    optional_desc: string | null;
    is_active: boolean;
}

export async function getAllFees(): Promise<{ fees: Fee[] }> {
    return handle(await fetch(`${BASE}/fees/admin`, { headers: authHeaders() }));
}

export async function createFee(data: {
    name_fee: string;
    price_fee: number;
    duration: number;
    description_forfait?: string;
    optional_title?: string;
    optional_price?: number;
    optional_desc?: string;
}): Promise<{ fee: Fee }> {
    return handle(await fetch(`${BASE}/fees`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }));
}

export async function updateFee(id: number, data: {
    name_fee: string;
    price_fee: number;
    duration: number;
    description_forfait?: string;
    optional_title?: string;
    optional_price?: number;
    optional_desc?: string;
}): Promise<{ fee: Fee }> {
    return handle(await fetch(`${BASE}/fees/${id}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }));
}

export async function desactivateFee(id: number): Promise<void> {
    await handle(await fetch(`${BASE}/fees/${id}`, { method: 'DELETE', headers: authHeaders() }));
}

export async function deleteFeePermanently(id: number): Promise<void> {
    await handle(await fetch(`${BASE}/fees/${id}/permanent`, { method: 'DELETE', headers: authHeaders() }));
}
