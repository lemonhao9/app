export async function up(pgm) {
    pgm.sql(`ALTER TABLE bike ADD COLUMN photo VARCHAR(500)`);
}

export async function down(pgm){
    pgm.sql(`ALTER TABLE bike DROP COLUMN photo`);
}