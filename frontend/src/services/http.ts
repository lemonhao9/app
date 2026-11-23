export const BASE = '/api/v1';

export function authHeaders(): HeadersInit {
    const token = localStorage.getItem('hch_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function errorMessage(error: unknown): string {
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object') {
        const { formErrors = [], fieldErrors = {} } = error as { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
        const messages = [
            ...formErrors,
            ...Object.entries(fieldErrors).map(([field, msgs]) => `${field} : ${msgs.join(', ')}`),
        ];
        if (messages.length > 0) return messages.join(' — ');
    }
    return 'Erreur';
}

export const SESSION_EXPIRED_EVENT = 'hch:session-expired';

function notifyIfSessionExpired(res: Response) {
    if (res.status === 401 && localStorage.getItem('hch_token')) {
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
}

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    const token = localStorage.getItem('hch_token');
    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    const res = await fetch(input, { ...init, headers });
    notifyIfSessionExpired(res);
    return res;
}

export async function handle(res: Response) {
    if (!res.ok) {
        notifyIfSessionExpired(res);
        throw new Error(errorMessage((await res.json().catch(() => ({}))).error));
    }
    return res.json();
}
