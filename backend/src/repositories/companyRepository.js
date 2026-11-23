import { query } from '../utils/db.js';

const COLUMNS = `name, legal_form, share_capital, rcs_city, siret, address_line, postal_code, city,
                 email, publication_director, host_name, host_address`;

export async function find() {
    const result = await query(`SELECT ${COLUMNS} FROM company WHERE company_id = 1`, []);
    return result.rows[0] ?? null;
}