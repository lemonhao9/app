export async function up(pgm) {
  pgm.sql(`ALTER TABLE intervention ADD COLUMN zone_id INTEGER REFERENCES zone(zone_id)`)
  pgm.sql(`
    UPDATE intervention i
    SET zone_id = s.zone_id
    FROM slot s
    WHERE s.slot_id = i.slot_id
  `)
  pgm.sql(`ALTER TABLE intervention ALTER COLUMN zone_id SET NOT NULL`)
  pgm.sql(`CREATE INDEX idx_intervention_zone_id ON intervention (zone_id)`)
  pgm.sql(`ALTER TABLE slot DROP COLUMN zone_id`)
}

export async function down(pgm) {
  pgm.sql(`ALTER TABLE slot ADD COLUMN zone_id INTEGER REFERENCES zone(zone_id)`)
  pgm.sql(`
    UPDATE slot s
    SET zone_id = i.zone_id
    FROM intervention i
    WHERE i.slot_id = s.slot_id
  `)
  pgm.sql(`
    UPDATE slot s
    SET zone_id = (SELECT MIN(p.zone_id) FROM positionner p WHERE p.user_id = s.technician_id)
    WHERE s.zone_id IS NULL
  `)
  pgm.sql(`DELETE FROM slot WHERE zone_id IS NULL`)
  pgm.sql(`ALTER TABLE slot ALTER COLUMN zone_id SET NOT NULL`)
  pgm.sql(`CREATE INDEX idx_slot_zone_id ON slot (zone_id)`)
  pgm.sql(`ALTER TABLE intervention DROP COLUMN zone_id`)
}
