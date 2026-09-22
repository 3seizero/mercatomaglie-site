// Carica i dati seed in Firestore: mercati, posteggi (con geometria mappa), espositori (pubblici)
// e espositori_riservati (CF, P.IVA, indirizzi). Idempotente: sovrascrive i documenti con lo stesso id.
// Uso:  cd scripts/firebase && npm install && node seed.mjs [--solo-pubblici]
import { db, readJson, FieldValue } from './lib.mjs';

const soloPubblici = process.argv.includes('--solo-pubblici');
const mercati = readJson('data/seed/mercati.json').mercati;
const posteggi = readJson('data/seed/posteggi.json').posteggi;
const mappa = Object.fromEntries(readJson('data/seed/posteggi-mappa.json').posteggi.map(p => [p.id, p]));
const espositori = readJson('data/seed/espositori.json').espositori;

const docId = (id) => id.replace(/\//g, '_');   // "A-55/56" → "A-55_56"
// Firestore non accetta array annidati: i vertici vanno come stringa SVG "x,y x,y …"
const svgPts = (pts) => pts ? pts.map(([x, y]) => `${x},${y}`).join(' ') : null;

async function batchWrite(coll, items, mapFn) {
  let batch = db.batch(); let n = 0; let tot = 0;
  for (const it of items) {
    const { id, data } = mapFn(it);
    batch.set(db.collection(coll).doc(docId(id)), { ...data, _aggiornato: FieldValue.serverTimestamp() });
    if (++n === 400) { await batch.commit(); tot += n; batch = db.batch(); n = 0; }
  }
  if (n) { await batch.commit(); tot += n; }
  console.log(`${coll}: ${tot} documenti`);
}

await batchWrite('mercati', mercati, m => ({ id: m.id, data: m }));
await batchWrite('posteggi', posteggi, p => {
  const g = mappa[p.id];
  return { id: p.id, data: { ...p, espositoreId: p.espositoreId ? docId(p.espositoreId) : null,
    mappa: g ? { pts: svgPts(g.pts), cx: g.cx, cy: g.cy, lat: g.lat, lon: g.lon, shape: g.shape || 'poly', r: g.r || null } : null } };
});
// posteggi presenti solo in piantina (PV-1..3, UOVA-1, A-47)
const extra = Object.values(mappa).filter(g => !posteggi.some(p => p.id === g.id));
await batchWrite('posteggi', extra, g => ({ id: g.id, data: { id: g.id, mercato: 'area-mercatale', settore: g.settore, numero: g.numero,
  etichetta: `Settore ${g.settore} · n. ${g.numero}`, tipo: 'posteggio', stato: 'da-verificare', espositoreId: null, inElenco: false,
  mappa: { pts: svgPts(g.pts), cx: g.cx, cy: g.cy, lat: g.lat, lon: g.lon, shape: g.shape || 'poly', r: g.r || null } } }));
await batchWrite('espositori', espositori, e => ({ id: e.id, data: { ...e, id: docId(e.id) } }));
if (!soloPubblici) {
  const riservati = readJson('data/seed/espositori_riservati.json').espositori;
  await batchWrite('espositori_riservati', riservati, r => ({ id: r.id, data: r }));
}
console.log('seed completato');
process.exit(0);
