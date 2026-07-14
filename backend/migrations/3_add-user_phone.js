export async function up(pgm) {
    pgm.sql(`ALTER TABLE "user" ADD COLUMN phone VARCHAR(20)`);
}

export async function down(pgm) {
    pgm.sql(`ALTER TABLE "user" DROP COLUMN phone`);
}