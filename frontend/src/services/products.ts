const BASE = '/api/v1';

function authHeaders(): HeadersInit {
    const token = localStorage.getItem('hch_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res: Response) {
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Erreur');
    return res.json();
}

export interface Product {
    product_id: number;
    name: string;
    category: string | null;
    description: string | null;
    price: string;
    image: string | null;
    is_active: boolean;
}

export async function getAllProducts(): Promise<{ products: Product[] }> {
    return handle(await fetch(`${BASE}/products/admin`, { headers: authHeaders() }));
}

export async function createProduct(data: {
    name: string;
    category?: string;
    description?: string;
    price: number;
}): Promise<{ product: Product }> {
    return handle(await fetch(`${BASE}/products`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }));
}

export async function updateProduct(id: number, data: {
    name: string;
    category?: string;
    description?: string;
    price: number;
}): Promise<{ product: Product }> {
    return handle(await fetch(`${BASE}/products/${id}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }));
}

export async function desactivateProduct(id: number): Promise<void> {
    await handle(await fetch(`${BASE}/products/${id}`, { method: 'DELETE', headers: authHeaders() }));
}

export async function deleteProductPermanently(id: number): Promise<void> {
    await handle(await fetch(`${BASE}/products/${id}/permanent`, { method: 'DELETE', headers: authHeaders() }));
}
