import pool, {query} from '../utils/db.js';

export async function findAllActive() {
    const result = await query(`
        SELECT * FROM additional_product WHERE is_active = TRUE ORDER BY category, name`,
        []
    );
    return result.rows;
}

export async function findByIds(ids) {
    if (ids.length === 0) return [];
    const result = await query(
        `SELECT * FROM additional_product WHERE product_id = ANY($1::int[]) AND is_active = TRUE`,
        [ids]
    );
    return result.rows;
}

export async function findAll() {
    const result = await query(`SELECT * FROM additional_product ORDER BY category, name`, []);
    return result.rows;
}

export async function create({ name, category, description, price }, runner = pool) {
    const result = await runner.query(
        `INSERT INTO additional_product (name, category, description, price) VALUES ($1, $2, $3, $4) RETURNING *`,
        [name, category ?? null, description ?? null, price]
    );
    return result.rows[0];
}

export async function update(productId, { name, category, description, price }, runner = pool) {
    const result = await runner.query(
        `UPDATE additional_product SET name=$2, category=$3, description=$4, price=$5
         WHERE product_id = $1 RETURNING *`,
        [productId, name, category ?? null, description ?? null, price]
    );
    return result.rows[0];
}

export async function findById(productId) {
    const result = await query(`SELECT * FROM additional_product WHERE product_id = $1`, [productId]);
    return result.rows[0] ?? null;
}

export async function desactivate(productId, runner = pool) {
    const result = await runner.query(
        `UPDATE additional_product SET is_active = false WHERE product_id = $1 RETURNING product_id`,
        [productId]
    );
    return result.rows[0] ?? null;
}

export async function countReferences(productId) {
    const result = await query(
        `SELECT (SELECT COUNT(*) FROM ajouter WHERE product_id = $1) AS ajouter_count`,
        [productId]
    );
    return { ajouterCount: Number(result.rows[0].ajouter_count) };
}

export async function remove(productId, runner = pool) {
    const result = await runner.query(
        `DELETE FROM additional_product WHERE product_id = $1 RETURNING product_id`,
        [productId]
    );
    return result.rows[0] ?? null;
}
