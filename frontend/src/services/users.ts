import { BASE, authHeaders, handle } from './http';

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
