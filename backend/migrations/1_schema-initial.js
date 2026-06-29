export async function up(pgm) {
  // ENUMs — à créer avant les tables
  pgm.sql(`CREATE TYPE intervention_state AS ENUM ('prochainement', 'en cours', 'terminée', 'annulée')`)
  pgm.sql(`CREATE TYPE user_role AS ENUM ('admin', 'technician', 'client')`)
  pgm.sql(`CREATE TYPE bike_type AS ENUM ('VTT', 'VTC', 'Route', 'Ville', 'Pliant', 'BMX', 'Enfant', 'Cargo-Triporteur')`)

  // Tables
  pgm.sql(`
    CREATE TABLE "user" (
      user_id       SERIAL PRIMARY KEY,
      email         VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255)        NOT NULL,
      name          VARCHAR(255),
      picture       VARCHAR(500),
      role          user_role NOT NULL DEFAULT 'client',
      is_active     BOOLEAN   NOT NULL DEFAULT TRUE
    )
  `)

  pgm.sql(`
    CREATE TABLE zone (
      zone_id   SERIAL PRIMARY KEY,
      name      VARCHAR(255) NOT NULL,
      color     VARCHAR(7),
      latitude  DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      geojson   JSONB,
      is_active BOOLEAN NOT NULL DEFAULT TRUE
    )
  `)

  pgm.sql(`
    CREATE TABLE fee (
      fee_id              SERIAL PRIMARY KEY,
      name_fee            VARCHAR(255)   NOT NULL,
      price_fee           NUMERIC(8, 2)  NOT NULL,
      description_forfait TEXT,
      duration            SMALLINT       NOT NULL,
      optional_title      VARCHAR(255),
      optional_price      NUMERIC(8, 2),
      optional_desc       TEXT,
      is_active           BOOLEAN NOT NULL DEFAULT TRUE
    )
  `)

  pgm.sql(`
    CREATE TABLE additional_product (
      product_id  SERIAL PRIMARY KEY,
      name        VARCHAR(255)  NOT NULL,
      category    VARCHAR(255),
      description TEXT,
      price       NUMERIC(8, 2) NOT NULL,
      image       VARCHAR(500),
      is_active   BOOLEAN NOT NULL DEFAULT TRUE
    )
  `)

  pgm.sql(`
    CREATE TABLE bike (
      bike_id     SERIAL PRIMARY KEY,
      brand       VARCHAR(255),
      model       VARCHAR(255),
      year        SMALLINT,
      bike_type   bike_type,
      is_electric BOOLEAN NOT NULL DEFAULT FALSE,
      user_id     INTEGER NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE
    )
  `)

  pgm.sql(`
    CREATE TABLE address (
      address_id   SERIAL PRIMARY KEY,
      number       SMALLINT,
      street_type  VARCHAR(50),
      address_name VARCHAR(255) NOT NULL,
      city         VARCHAR(255),
      postal_code  VARCHAR(10),
      longitude    DOUBLE PRECISION,
      latitude     DOUBLE PRECISION,
      is_default   BOOLEAN NOT NULL DEFAULT FALSE,
      zone_id      INTEGER REFERENCES zone(zone_id),
      user_id      INTEGER NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE
    )
  `)

  pgm.sql(`
    CREATE TABLE slot (
      slot_id  SERIAL PRIMARY KEY,
      start_at TIME  NOT NULL,
      ended_at TIME  NOT NULL,
      day      DATE  NOT NULL,
      zone_id  INTEGER NOT NULL REFERENCES zone(zone_id),
      fee_id   INTEGER NOT NULL REFERENCES fee(fee_id)
    )
  `)

  pgm.sql(`
    CREATE TABLE intervention (
      intervention_id SERIAL PRIMARY KEY,
      state           intervention_state NOT NULL DEFAULT 'prochainement',
      total_price     NUMERIC(8, 2),
      is_paid         BOOLEAN NOT NULL DEFAULT FALSE,
      bike_id         INTEGER REFERENCES bike(bike_id),
      slot_id         INTEGER NOT NULL REFERENCES slot(slot_id) UNIQUE,
      technician_id   INTEGER REFERENCES "user"(user_id),
      client_id       INTEGER NOT NULL REFERENCES "user"(user_id)
    )
  `)

  pgm.sql(`
    CREATE TABLE intervention_photo (
      photo_id        SERIAL PRIMARY KEY,
      intervention_id INTEGER NOT NULL REFERENCES intervention(intervention_id) ON DELETE CASCADE,
      url             VARCHAR(500) NOT NULL,
      created_at      TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)

  pgm.sql(`
    CREATE TABLE intervention_comment (
      comment_id      SERIAL PRIMARY KEY,
      intervention_id INTEGER NOT NULL REFERENCES intervention(intervention_id) ON DELETE CASCADE,
      user_id         INTEGER NOT NULL REFERENCES "user"(user_id),
      content         TEXT,
      photo_url       VARCHAR(500),
      created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT chk_comment_has_content CHECK (content IS NOT NULL OR photo_url IS NOT NULL)
    )
  `)

  pgm.sql(`
    CREATE TABLE positionner (
      zone_id INTEGER NOT NULL REFERENCES zone(zone_id)   ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
      PRIMARY KEY (zone_id, user_id)
    )
  `)

  pgm.sql(`
    CREATE TABLE ajouter (
      intervention_id INTEGER NOT NULL REFERENCES intervention(intervention_id) ON DELETE CASCADE,
      product_id      INTEGER NOT NULL REFERENCES additional_product(product_id),
      quantity        SMALLINT NOT NULL DEFAULT 1,
      PRIMARY KEY (intervention_id, product_id)
    )
  `)

  // Index
  pgm.sql(`CREATE INDEX idx_intervention_client_id      ON intervention(client_id)`)
  pgm.sql(`CREATE INDEX idx_intervention_technician_id  ON intervention(technician_id)`)
  pgm.sql(`CREATE INDEX idx_intervention_state          ON intervention(state)`)
  pgm.sql(`CREATE INDEX idx_bike_user_id                ON bike(user_id)`)
  pgm.sql(`CREATE INDEX idx_address_user_id             ON address(user_id)`)
  pgm.sql(`CREATE INDEX idx_address_zone_id             ON address(zone_id)`)
  pgm.sql(`CREATE INDEX idx_slot_zone_id                ON slot(zone_id)`)
  pgm.sql(`CREATE INDEX idx_slot_day                    ON slot(day)`)
  pgm.sql(`CREATE INDEX idx_intervention_photo_int_id   ON intervention_photo(intervention_id)`)
  pgm.sql(`CREATE INDEX idx_intervention_comment_int_id ON intervention_comment(intervention_id)`)
}

export async function down(pgm) {
  pgm.sql(`DROP TABLE IF EXISTS ajouter`)
  pgm.sql(`DROP TABLE IF EXISTS positionner`)
  pgm.sql(`DROP TABLE IF EXISTS intervention_comment`)
  pgm.sql(`DROP TABLE IF EXISTS intervention_photo`)
  pgm.sql(`DROP TABLE IF EXISTS intervention`)
  pgm.sql(`DROP TABLE IF EXISTS slot`)
  pgm.sql(`DROP TABLE IF EXISTS address`)
  pgm.sql(`DROP TABLE IF EXISTS bike`)
  pgm.sql(`DROP TABLE IF EXISTS additional_product`)
  pgm.sql(`DROP TABLE IF EXISTS fee`)
  pgm.sql(`DROP TABLE IF EXISTS zone`)
  pgm.sql(`DROP TABLE IF EXISTS "user"`)
  pgm.sql(`DROP TYPE IF EXISTS bike_type`)
  pgm.sql(`DROP TYPE IF EXISTS user_role`)
  pgm.sql(`DROP TYPE IF EXISTS intervention_state`)
}