export async function up(pgm) {
  pgm.sql(`
    DO $$
    BEGIN
      EXECUTE format('ALTER DATABASE %I SET timezone TO %L', current_database(), 'Europe/Paris');
    END
    $$
  `)
}

export async function down(pgm) {
  pgm.sql(`
    DO $$
    BEGIN
      EXECUTE format('ALTER DATABASE %I RESET timezone', current_database());
    END
    $$
  `)
}
