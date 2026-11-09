export async function up(pgm) {
  pgm.sql(`
    ALTER TABLE "user"
      ADD COLUMN password_changed_at TIMESTAMPTZ
  `)
}

export async function down(pgm) {
  pgm.sql(`
    ALTER TABLE "user"
      DROP COLUMN password_changed_at
  `)
}
