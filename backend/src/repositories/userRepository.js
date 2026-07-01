import {query} from '../utils/db.js';

export async function findByEmail(email) {
    const results = await query('SELECT * FROM "user" WHERE email = $1', [email]);
    return results.rows[0] ?? null;
}

export async function create({email, passwordHash, name, role = 'client'}) {
    const results = await query(
        `INSERT INTO "user" (email, password_hash, name, role)
         VALUES ($1, $2, $3, $4)
         RETURNING user_id, email, name, role, picture, is_active`,
        [email, passwordHash, name, role]
    );
    return results.rows[0];
}

export async function anonymize(userId) {
    const results = await query(
        `UPDATE "user"
        SET email = $2,
            name = 'Utilisateur supprimé',
            picture = null,
            password_hash = 'Compte_supprimé',
            is_active = FALSE
        WHERE user_id = $1
        RETURNING user_id`,
        [userId, `anonyme_${userId}@supprime.local`]
    );
    return results.rows[0] ?? null;
}

export async function deleteAddresses(userId) {
    await query('DELETE FROM address WHERE user_id = $1', [userId]);
}
