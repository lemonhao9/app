export async function up(pgm) {
  pgm.sql(`
    UPDATE address a SET is_default = FALSE
    WHERE a.is_default AND EXISTS (
      SELECT 1 FROM address b
      WHERE b.user_id = a.user_id AND b.is_default AND b.address_id < a.address_id
    )
  `)
  pgm.sql(`CREATE UNIQUE INDEX address_one_default_per_user ON address(user_id) WHERE is_default`)
}

export async function down(pgm) {
  pgm.sql(`DROP INDEX IF EXISTS address_one_default_per_user`)
}
