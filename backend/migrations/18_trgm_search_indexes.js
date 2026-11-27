export async function up(pgm) {
  pgm.sql(`CREATE EXTENSION IF NOT EXISTS pg_trgm`)
  pgm.sql(`CREATE INDEX idx_user_name_trgm ON "user" USING gin (name gin_trgm_ops)`)
  pgm.sql(`CREATE INDEX idx_user_email_trgm ON "user" USING gin (email gin_trgm_ops)`)
  pgm.sql(`CREATE INDEX idx_user_phone_trgm ON "user" USING gin (phone gin_trgm_ops)`)
  pgm.sql(`CREATE INDEX idx_address_name_trgm ON address USING gin (address_name gin_trgm_ops)`)
  pgm.sql(`CREATE INDEX idx_address_city_trgm ON address USING gin (city gin_trgm_ops)`)
  pgm.sql(`CREATE INDEX idx_address_postal_code_trgm ON address USING gin (postal_code gin_trgm_ops)`)
}

export async function down(pgm) {
  pgm.sql(`DROP INDEX IF EXISTS idx_address_postal_code_trgm`)
  pgm.sql(`DROP INDEX IF EXISTS idx_address_city_trgm`)
  pgm.sql(`DROP INDEX IF EXISTS idx_address_name_trgm`)
  pgm.sql(`DROP INDEX IF EXISTS idx_user_phone_trgm`)
  pgm.sql(`DROP INDEX IF EXISTS idx_user_email_trgm`)
  pgm.sql(`DROP INDEX IF EXISTS idx_user_name_trgm`)
  pgm.sql(`DROP EXTENSION IF EXISTS pg_trgm`)
}