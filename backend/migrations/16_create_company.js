export async function up(pgm) {
  pgm.sql(`
    CREATE TABLE company (
      company_id           SMALLINT PRIMARY KEY DEFAULT 1 CHECK (company_id = 1),
      name                 VARCHAR(100) NOT NULL,
      legal_form           VARCHAR(50)  NOT NULL,
      share_capital        INTEGER      NOT NULL CHECK (share_capital >= 0),
      rcs_city             VARCHAR(100) NOT NULL,
      siret                CHAR(14)     NOT NULL CHECK (siret ~ '^[0-9]{14}$'),
      address_line         VARCHAR(255) NOT NULL,
      postal_code          VARCHAR(10)  NOT NULL,
      city                 VARCHAR(100) NOT NULL,
      email                VARCHAR(255) NOT NULL,
      publication_director VARCHAR(255) NOT NULL,
      host_name            VARCHAR(255) NOT NULL,
      host_address         VARCHAR(255) NOT NULL,
      updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
    )
  `)
  pgm.sql(`
    INSERT INTO company (name, legal_form, share_capital, rcs_city, siret, address_line, postal_code, city,
                         email, publication_director, host_name, host_address)
    VALUES ('LeCycleLyonnais', 'SARL', 25000, 'Lyon', '81234567800019', '12 rue de la Part-Dieu', '69003', 'Lyon',
            'contact@homecyclhome.fr', 'la gérance de LeCycleLyonnais', 'OVH SAS', '2 rue Kellermann, 59100 Roubaix, France')
  `)
}

export async function down(pgm) {
  pgm.sql(`DROP TABLE company`)
}
