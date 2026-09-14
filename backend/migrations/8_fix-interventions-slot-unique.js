export async function up(pgm) {
  pgm.sql(`ALTER TABLE intervention DROP CONSTRAINT intervention_slot_id_key`)
  pgm.sql(`CREATE UNIQUE INDEX idx_intervention_slot_id_active ON intervention(slot_id) WHERE state != 'annulée'`)
}

export async function down(pgm) {
  pgm.sql(`DROP INDEX IF EXISTS idx_intervention_slot_id_active`)
  pgm.sql(`ALTER TABLE intervention ADD CONSTRAINT intervention_slot_id_key UNIQUE (slot_id)`)
}
