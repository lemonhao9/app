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

export async function handle(res: Response) {
    if (!res.ok) throw new Error(errorMessage((await res.json().catch(() => ({}))).error));
    return res.json();
}
