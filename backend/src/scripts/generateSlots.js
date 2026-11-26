import 'dotenv/config';
import { syncSlots } from '../services/slotGenerationService.js';

syncSlots()
    .then(({ created, deleted, days }) => {
        console.log(`Terminé : ${days} jour(s) traité(s), ${created} créneau(x) créé(s), ${deleted} supprimé(s).`);
        process.exit(0);
    })
    .catch((err) => {
        console.error('Erreur fatale pendant la génération :', err);
        process.exit(1);
    });