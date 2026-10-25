export async function up(pgm) {
  pgm.sql(`
    ALTER TABLE intervention
      ADD COLUMN address_name        VARCHAR(255),
      ADD COLUMN address_city        VARCHAR(255),
      ADD COLUMN address_postal_code VARCHAR(10),
      ADD COLUMN address_latitude    DOUBLE PRECISION,
      ADD COLUMN address_longitude   DOUBLE PRECISION
  `)
  pgm.sql(`
    UPDATE intervention i SET
      address_name        = a.address_name,
      address_city        = a.city,
      address_postal_code = a.postal_code,
      address_latitude    = a.latitude,
      address_longitude   = a.longitude
    FROM address a
    WHERE a.address_id = i.address_id
  `)
  pgm.sql(`ALTER TABLE intervention ALTER COLUMN address_id DROP NOT NULL`)
  pgm.sql(`ALTER TABLE intervention DROP CONSTRAINT intervention_address_id_fkey`)
  pgm.sql(`
    ALTER TABLE intervention ADD CONSTRAINT intervention_address_id_fkey
      FOREIGN KEY (address_id) REFERENCES address(address_id) ON DELETE SET NULL
  `)
}

export async function down(pgm) {
  pgm.sql(`ALTER TABLE intervention DROP CONSTRAINT intervention_address_id_fkey`)
  pgm.sql(`
    ALTER TABLE intervention ADD CONSTRAINT intervention_address_id_fkey
      FOREIGN KEY (address_id) REFERENCES address(address_id)
  `)
  pgm.sql(`ALTER TABLE intervention ALTER COLUMN address_id SET NOT NULL`)
  pgm.sql(`
    ALTER TABLE intervention
      DROP COLUMN address_name,
      DROP COLUMN address_city,
      DROP COLUMN address_postal_code,
      DROP COLUMN address_latitude,
      DROP COLUMN address_longitude
  `)
}