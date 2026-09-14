export async function up(pgm) {
  pgm.sql(`ALTER TABLE slot ADD COLUMN technician_id INTEGER NOT NULL REFERENCES "user"(user_id)`)
  pgm.sql(`CREATE INDEX idx_slot_technician_id ON slot(technician_id)`)
}

export async function down(pgm) {
  pgm.sql(`DROP INDEX IF EXISTS idx_slot_technician_id`)
  pgm.sql(`ALTER TABLE slot DROP COLUMN technician_id`)
}
