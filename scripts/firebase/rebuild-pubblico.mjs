// Ricostruisce i documenti pubblico/{mercatoId} (riassunto espositori + posteggi per l'app pubblica).
import { db, FieldValue } from './lib.mjs';
import { costruisciPubblico } from './pubblico.mjs';
const esp = (await db.collection('espositori').get()).docs.map(d => d.data());
const post = (await db.collection('posteggi').get()).docs.map(d => d.data());
const pub = costruisciPubblico(esp, post);
for (const [m, d] of Object.entries(pub)) {
  await db.collection('pubblico').doc(m).set({ ...d, aggiornato: FieldValue.serverTimestamp() });
  console.log(m, Object.keys(d.espositori).length, 'espositori', Object.keys(d.posteggi).length, 'posteggi');
}
process.exit(0);
