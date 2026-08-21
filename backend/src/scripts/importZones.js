import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import * as zoneRepository from '../repositories/zoneRepository.js';
import { zoneSchema } from '../utils/schemas.js';

function computeCentroid(ring) {
    const [sumLng, sumLat] = ring.reduce(
        ([lng, lat], [pointLng, pointLat]) => [lng + pointLng, lat + pointLat],
        [0, 0]
    );
    return {
        longitude: Number((sumLng / ring.length).toFixed(6)),
        latitude: Number((sumLat / ring.length).toFixed(6)),
    };
}

async function importZones() {
    // Doit tourner dans le conteneur `api` (DATABASE_URL n'existe que là-dedans,
    // `db` n'est pas résolvable/exposé hors du réseau Docker) — donc chemin par
    // défaut relatif au dossier backend/ (bind-mount `/app` en dev), pas un chemin
    // Windows absolu qui n'existerait pas dans le conteneur Linux.
    const jsonPath = process.env.ZONES_JSON_PATH || path.join(process.cwd(), 'Zones.json');

    const raw = await fs.readFile(jsonPath, 'utf8');
    const zones = JSON.parse(raw);

    console.log(`${zones.length} zone(s) trouvée(s) dans ${jsonPath}`);

    let created = 0;
    let failed = 0;

    for (const source of zones) {
        try {
            const geometry = typeof source.geometry === 'string' ? JSON.parse(source.geometry) : source.geometry;

            if (geometry.type !== 'Polygon') {
                throw new Error(`type de géométrie non supporté : ${geometry.type}`);
            }

            const { longitude, latitude } = computeCentroid(geometry.coordinates[0]);

            const candidate = {
                name: source.name,
                color: source.color ?? undefined,
                latitude,
                longitude,
                geojson: { type: 'Feature', geometry },
            };

            const parsed = zoneSchema.safeParse(candidate);
            if (!parsed.success) {
                throw new Error(JSON.stringify(parsed.error.flatten()));
            }

            const zone = await zoneRepository.create(parsed.data);
            console.log(`✅ ${zone.name} (zone_id ${zone.zone_id})`);
            created++;
        } catch (err) {
            console.error(`❌ ${source?.name ?? '(nom inconnu)'} — ${err.message}`);
            failed++;
        }
    }

    console.log(`\nTerminé : ${created} zone(s) créée(s), ${failed} échec(s) sur ${zones.length}.`);
}

importZones()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Erreur fatale pendant l\'import :', err);
        process.exit(1);
    });
