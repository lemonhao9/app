import pool, { query } from '../utils/db.js';

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

export async function create({ email, passwordHash, name, phone = null, role = 'client' }, runner = pool) {
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

export async function update(userId, { name, phone, picture, email, passwordHash }, runner = pool) {
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
            is_active = FALSE,
            deleted_at = now()
        WHERE user_id = $1
        RETURNING user_id`,
        [userId, `anonyme_${userId}@supprime.local`]
    );
    return results.rows[0] ?? null;
}

export async function deleteAddresses(userId, runner = pool) {
    await runner.query(`DELETE FROM address WHERE user_id = $1`, [userId]);
}

function likePattern(value) {
    return `%${value.replace(/[\\%_]/g, '\\$&')}%`;
}

export async function findAll({ role, q, limit, offset = 0 } = {}, runner = pool) {

    const conditions = [];
    const params = [];
    if (role) {
        params.push(role);
        conditions.push(`role = $${params.length}`);
    }
    if (q) {
        params.push(likePattern(q));
        conditions.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length})`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    let pagination = '';
    if (limit) {
        params.push(limit + 1, offset);
        pagination = `LIMIT $${params.length - 1} OFFSET $${params.length}`;
    }
    const results = await runner.query(
        `SELECT user_id, email, name, phone, role, picture, is_active, must_change_password, deleted_at
         FROM "user"
         ${where}
         ORDER BY name, user_id
         ${pagination}`,
        params
    );
    return results.rows;
}

export async function findClients({ status, q, address, zoneIds, limit, offset }, runner = pool) {
    const conditions = [`u.role = 'client'`];
    const params = [];
    if (status === 'active') {
        conditions.push('u.is_active AND u.deleted_at IS NULL');
    } else if (status === 'inactive') {
        conditions.push('NOT u.is_active AND u.deleted_at IS NULL');
    } else if (status === 'deleted') {
        conditions.push('u.deleted_at IS NOT NULL');
    }
    if (q) {
        params.push(likePattern(q));
        const n = params.length;
        conditions.push(`(u.name ILIKE $${n} OR u.email ILIKE $${n} OR u.phone ILIKE $${n})`);
    }
    if (address) {
        params.push(likePattern(address));
        const n = params.length;
        conditions.push(`EXISTS (SELECT 1 FROM address ad WHERE ad.user_id = u.user_id
                         AND (ad.address_name ILIKE $${n} OR ad.city ILIKE $${n} OR ad.postal_code ILIKE $${n}))`);
    }
    if (zoneIds?.length) {
        params.push(zoneIds);
        conditions.push(`EXISTS (SELECT 1 FROM address ad WHERE ad.user_id = u.user_id AND ad.zone_id = ANY($${params.length}::int[]))`);
    }
    params.push(limit, offset);
    const results = await runner.query(
        `SELECT u.user_id, u.email, u.name, u.phone, u.is_active, u.deleted_at,
                a.address_name, z.name AS zone_name,
                (SELECT count(*) FROM bike b WHERE b.user_id = u.user_id)::int AS bike_count,
                count(*) OVER()::int AS total
         FROM "user" u
         LEFT JOIN LATERAL (
             SELECT address_name, zone_id FROM address
             WHERE address.user_id = u.user_id
             ORDER BY is_default DESC, address_id
             LIMIT 1
         ) a ON true
         LEFT JOIN zone z ON z.zone_id = a.zone_id
         WHERE ${conditions.join(' AND ')}
         ORDER BY u.name, u.user_id
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
    );
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

export async function updateIdentity(userId, { name, email, phone }, runner = pool) {
    const results = await runner.query(
        `UPDATE "user"
         SET name = $2, email = $3, phone = $4
         WHERE user_id = $1 AND deleted_at IS NULL
         RETURNING user_id, email, name, phone, role, picture, is_active, must_change_password, deleted_at`,
        [userId, name, email, phone]
    );
    return results.rows[0] ?? null;
}

export async function setActive(userId, isActive, runner = pool) {
    const results = await runner.query(
        `UPDATE "user"
         SET is_active = $2
         WHERE user_id = $1 AND deleted_at IS NULL
         RETURNING user_id, email, name, phone, role, picture, is_active, must_change_password, deleted_at`,
        [userId, isActive]
    );
    return results.rows[0] ?? null;
}
