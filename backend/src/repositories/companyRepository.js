import { query } from '../utils/db.js';

const COLUMNS = `name, legal_form, share_capital, rcs_city, siret, address_line, postal_code, city,
                 email, publication_director, host_name, host_address`;

export async function find() {
    const result = await query(`SELECT ${COLUMNS} FROM company WHERE company_id = 1`, []);
    return result.rows[0] ?? null;
}

export async function update(data) {
    const result = await query(
        `UPDATE company
         SET name = $1, legal_form = $2, share_capital = $3, rcs_city = $4, siret = $5, address_line = $6,
             postal_code = $7, city = $8, email = $9, publication_director = $10, host_name = $11, host_address = $12,
             updated_at = now()
         WHERE company_id = 1
         RETURNING ${COLUMNS}`,
        [data.name, data.legal_form, data.share_capital, data.rcs_city, data.siret, data.address_line,
         data.postal_code, data.city, data.email, data.publication_director, data.host_name, data.host_address]
    );
    return result.rows[0] ?? null;
}
