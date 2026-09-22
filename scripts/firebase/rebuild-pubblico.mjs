// Ricostruisce i documenti pubblico/{mercatoId} (riassunto espositori + posteggi per l'app pubblica).
import { db, FieldValue } from './lib.mjs';
const PUB = ['id','denominazione','alias','referente','tipo','categoria','mercati','settori','whatsapp','telegram','descrizione','foto','attivo'];
const esp = (await db.collection('espositori').get()).docs.map(d => d.data());
const post = (await db.collection('posteggi').get()).docs.map(d => d.data());
const mercati = (await db.collection('mercati').get()).docs.map(d => d.id);
for (const m of mercati) {
  const P = {}; for (const p of post.filter(p => p.mercato === m)) P[p.id] = { espositoreId: p.espositoreId || null, stato: p.stato || null, note: p.note || null };
  const ids = new Set(Object.values(P).map(p => p.espositoreId).filter(Boolean));
  const E = {}; for (const e of esp.filter(e => ids.has(e.id))) { E[e.id] = {}; for (const k of PUB) if (e[k] !== undefined) E[e.id][k] = e[k]; }
  await db.collection('pubblico').doc(m).set({ mercato: m, espositori: E, posteggi: P, aggiornato: FieldValue.serverTimestamp() });
  console.log(m, Object.keys(E).length, 'espositori', Object.keys(P).length, 'posteggi');
}
process.exit(0);
