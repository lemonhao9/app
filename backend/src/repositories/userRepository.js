import pool, {query} from '../utils/db.js';

const TEMP_PASSWORD_EXPIRED = `(temp_password_expires_at IS NOT NULL AND temp_password_expires_at <= now()) AS temp_password_expired`;
const PASSWORD_CHANGED_EPOCH = `floor(extract(epoch FROM password_changed_at))::bigint AS password_changed_epoch`;

export async function findByEmail(email) {
    const results = await query(`SELECT *, ${TEMP_PASSWORD_EXPIRED}, ${PASSWORD_CHANGED_EPOCH} FROM "user" WHERE email = $1`, [email]);
    return results.rows[0] ?? null;
}

export async function findById(userId) {
    const results = await query(`SELECT *, ${TEMP_PASSWORD_EXPIRED}, ${PASSWORD_CHANGED_EPOCH} FROM "user" WHERE user_id = $1`, [userId]);
    return results.rows[0] ?? null;
}

export async function create({email, passwordHash, name, phone = null, role = 'client'}, runner = pool) {
    const results = await runner.query(
        `INSERT INTO "user" (email, password_hash, name, phone, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING user_id, email, name, phone, role, picture, is_active`,
        [email, passwordHash, name, phone, role]
    );
    return results.rows[0];
}

export async function createWithTemporaryPassword({ email, passwordHash, name, phone = null, role }, runner = pool) {
    const results = await runner.query(
        `INSERT INTO "user" (email, password_hash, name, phone, role, must_change_password, temp_password_expires_at)
         VALUES ($1, $2, $3, $4, $5, TRUE, now() + interval '72 hours')
         RETURNING user_id, email, name, phone, role, picture, is_active, must_change_password, temp_password_expires_at`,
        [email, passwordHash, name, phone, role]
    );
    return results.rows[0];
}

export async function update(userId, {name, phone, picture, email, passwordHash}, runner = pool) {
    const results = await runner.query(
        `UPDATE "user" SET name = $1, phone = $2, picture = $3, email = $4, password_hash = $5 WHERE user_id = $6 RETURNING user_id, email, name, phone, role, picture, is_active`,
        [name, phone ?? null, picture, email, passwordHash, userId]
    );
    return results.rows[0] ?? null;
}


export async function anonymize(userId, runner = pool) {
    const results = await runner.query(
        `UPDATE "user"
        SET email = $2,
            name = 'Utilisateur supprimé',
            phone = null,
            picture = null,
            password_hash = 'Compte_supprimé',
            is_active = FALSE
        WHERE user_id = $1
        RETURNING user_id`,
        [userId, `anonyme_${userId}@supprime.local`]
    );
    return results.rows[0] ?? null;
}

export async function deleteAddresses(userId, runner = pool) {
    await runner.query(`DELETE FROM address WHERE user_id = $1`, [userId]);
}

export async function findAll({role} = {}, runner = pool) {
    const results = role
        ? await runner.query('SELECT * FROM "user" WHERE role = $1 ORDER BY user_id', [role])
        : await runner.query('SELECT * FROM "user" ORDER BY user_id');
    return results.rows; 
}

export async function updatePassword(userId, passwordHash, runner = pool) {
    const results = await runner.query(
        `UPDATE "user"
         SET password_hash = $2, must_change_password = FALSE, temp_password_expires_at = NULL, password_changed_at = now()
         WHERE user_id = $1
         RETURNING user_id, email, name, phone, role, picture, is_active, must_change_password`,
        [userId, passwordHash]
    );
    return results.rows[0] ?? null;
}

export async function resetTemporaryPassword(userId, passwordHash, runner = pool) {
    const results = await runner.query(
        `UPDATE "user"
         SET password_hash = $2,
             must_change_password = TRUE,
             temp_password_expires_at = now() + interval '72 hours',
             password_changed_at = now()
         WHERE user_id = $1 AND role = 'technician'
         RETURNING user_id, email, name, phone, role, picture, is_active, must_change_password, temp_password_expires_at`,
        [userId, passwordHash]
    );
    return results.rows[0] ?? null;
}
