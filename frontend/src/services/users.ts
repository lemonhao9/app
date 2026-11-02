import { BASE, authHeaders, handle } from './http';
import type { User } from '../context/AuthContext';

export interface ClientOption {
    user_id: number;
    name: string;
    email: string;
}

export interface BikeOption {
    bike_id: number;
    brand: string | null;
    model: string | null;
}

export async function getClients(): Promise<{ users: ClientOption[] }> {
    return handle(await fetch(`${BASE}/users?role=client`, { headers: authHeaders() }));
}

export async function getUserBikes(userId: number): Promise<{ bikes: BikeOption[] }> {
    return handle(await fetch(`${BASE}/users/${userId}/bikes`, { headers: authHeaders() }));
}

export async function updateMe(data: FormData): Promise<{ user: User }> {
    return handle(await fetch(`${BASE}/users/me`, {
        method: 'PUT',
        headers: authHeaders(),
        body: data,
    }));
}

export async function deleteMyAccount(): Promise<void> {
    const res = await fetch(`${BASE}/users/account`, { method: 'DELETE', headers: authHeaders() });
    if (!res.ok) await handle(res);
}
export interface CreatedTechnician {
    user: { user_id: number; email: string; name: string; phone: string | null };
    temporaryPassword: string;
}

export async function createTechnician(data: { email: string; name: string; phone?: string }): Promise<CreatedTechnician> {
    return handle(await fetch(`${BASE}/users/technicians`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }));
}
