import { BASE, authHeaders, handle } from './http';
export interface Company {
    name: string;
    legal_form: string;
    share_capital: number;
    rcs_city: string;
    siret: string;
    address_line: string;
    postal_code: string;
    city: string;
    email: string;
    publication_director: string;
    host_name: string;
    host_address: string;
}

export async function getCompany(init?: RequestInit): Promise<{ company: Company }> {
    return handle(await fetch(`${BASE}/company`, init));
}

export async function updateCompany(data: Company): Promise<{ company: Company }> {
    return handle(await fetch(`${BASE}/company`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }));
}

export function formatSiret(siret: string): string {
    return siret.replace(/^(\d{3})(\d{3})(\d{3})(\d{5})$/, '$1 $2 $3 $4');
}

export function formatCapital(amount: number): string {
    return `${amount.toLocaleString('fr-FR')} €`;
}
