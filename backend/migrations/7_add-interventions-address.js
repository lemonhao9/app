export async function up(pgm) {
  pgm.sql(`ALTER TABLE intervention ADD COLUMN address_id INTEGER NOT NULL REFERENCES address(address_id)`)
  pgm.sql(`CREATE INDEX idx_intervention_address_id ON intervention(address_id)`)
}

export async function down(pgm) {
  pgm.sql(`DROP INDEX IF EXISTS idx_intervention_address_id`)
  pgm.sql(`ALTER TABLE intervention DROP COLUMN address_id`)
}