import { BASE, authHeaders, handle } from './http';

export interface Address {
    address_id: number;
    address_name: string;
    city: string | null;
    postal_code: string | null;
    latitude: number | null;
    longitude: number | null;
    is_default: boolean;
    zone_id: number | null;
    zone_name: string | null;
    zone_active: boolean | null;
}

export async function getMyAddresses(): Promise<{ addresses: Address[] }> {
    return handle(await fetch(`${BASE}/addresses/me`, { headers: authHeaders() }));
}

export async function createAddress(label: string): Promise<{ address: Address }> {
    return handle(await fetch(`${BASE}/addresses`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
    }));
}

export async function updateAddress(id: number, label: string): Promise<{ address: Address }> {
    return handle(await fetch(`${BASE}/addresses/${id}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
    }));
}

export async function setDefaultAddress(id: number): Promise<{ address: Address }> {
    return handle(await fetch(`${BASE}/addresses/${id}/default`, {
        method: 'PATCH',
        headers: authHeaders(),
    }));
}

export async function deleteAddress(id: number): Promise<void> {
    const res = await fetch(`${BASE}/addresses/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (!res.ok) await handle(res);
}
