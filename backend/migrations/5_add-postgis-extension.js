export async function up(pgm) {
    pgm.sql('CREATE EXTENSION IF NOT EXISTS postgis;');
}

export async function down(pgm) {
    pgm.sql('DROP EXTENSION IF EXISTS postgis;');
}