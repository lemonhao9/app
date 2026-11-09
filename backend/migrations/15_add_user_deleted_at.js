export async function up(pgm) {
  pgm.sql(`ALTER TABLE "user" ADD COLUMN deleted_at TIMESTAMPTZ`)
  pgm.sql(`UPDATE "user" SET deleted_at = now() WHERE password_hash = 'Compte_supprimé'`)
}

export async function down(pgm) {
  pgm.sql(`ALTER TABLE "user" DROP COLUMN deleted_at`)
}
