export async function up(pgm) {
  pgm.sql(`ALTER TABLE intervention ADD COLUMN fee_price NUMERIC(8, 2)`)
  pgm.sql(`
    UPDATE intervention i SET fee_price = f.price_fee
    FROM slot s JOIN fee f ON f.fee_id = s.fee_id
    WHERE s.slot_id = i.slot_id
  `)
  pgm.sql(`ALTER TABLE intervention ALTER COLUMN fee_price SET NOT NULL`)

  pgm.sql(`ALTER TABLE ajouter ADD COLUMN unit_price NUMERIC(8, 2)`)
  pgm.sql(`
    UPDATE ajouter aj SET unit_price = ap.price
    FROM additional_product ap
    WHERE ap.product_id = aj.product_id
  `)
  pgm.sql(`ALTER TABLE ajouter ALTER COLUMN unit_price SET NOT NULL`)
}

export async function down(pgm) {
  pgm.sql(`ALTER TABLE ajouter DROP COLUMN unit_price`)
  pgm.sql(`ALTER TABLE intervention DROP COLUMN fee_price`)
}
