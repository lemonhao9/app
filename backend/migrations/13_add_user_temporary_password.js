export async function up(pgm) {
  pgm.sql(`
    ALTER TABLE "user"
      ADD COLUMN must_change_password     BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN temp_password_expires_at TIMESTAMPTZ
  `)
}

export async function down(pgm) {
  pgm.sql(`
    ALTER TABLE "user"
      DROP COLUMN temp_password_expires_at,
      DROP COLUMN must_change_password
  `)
}
