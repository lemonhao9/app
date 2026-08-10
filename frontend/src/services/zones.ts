const BASE = '/api/v1';

function authHeaders(): HeadersInit {
    const token = localStorage.getItem('hch_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res: Response) {
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Erreur');
    return res.json();
}

export interface Zone {
    zone_id: number;
    name: string;
    color: string | null;
    latitude: number | null;
    longitude: number | null;
    geojson: GeoJSON.Feature;
    is_active: boolean;
}

export interface Technician {
    user_id: number;
    name : string;
    email: string;
}

export async function getZones(): Promise<{ zones: Zone[] }> {
    return handle(await fetch(`${BASE}/zones`, { headers: authHeaders() }));
}

export async function createZone(data: {name: string; color?: string; latitude?: number; longitude?: number; geojson: GeoJSON.Feature}) {
    return handle(await fetch(`${BASE}/zones`, {
        method: 'POST',
        headers: {...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }));
}

export async function updateZone(id: number, data: Parameters<typeof createZone>[0]) {
    return handle(await fetch(`${BASE}/zones/${id}`, {
        method: 'PUT',
        headers: {...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }));
}

export async function deactivateZone(id: number) {
    return handle(await fetch(`${BASE}/zones/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    }));
}

export async function getZoneTechnicians(id: number):Promise<{ technicians: Technician[] }> {
    return handle(await fetch(`${BASE}/zones/${id}/technicians`, { headers: authHeaders() }));
}

export async function assignTechnician(id: number, userId: number) {
    return handle(await fetch(`${BASE}/zones/${id}/technicians`, {
        method: 'POST',
        headers: {...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
    }));
}

export async function unassignTechnician(id: number, userId: number) {
    return handle(await fetch(`${BASE}/zones/${id}/technicians/${userId}`, {
        method: 'DELETE',
        headers: authHeaders(),
    }));
}

export async function getTechnicians(): Promise<{ users: Technician[] }> {
    return handle(await fetch(`${BASE}/users?role=technician`, { headers: authHeaders() }));
}