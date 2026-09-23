// Carica i dati seed in Firestore (modello v3, espositore-centrico): mercati, posteggi (geometria mappa,
// SENZA assegnatario), espositori (fissi con posteggi[] ricavati da posteggi.json, spuntisti), espositori_riservati,
// impostazioni. Idempotente: sovrascrive i documenti con lo stesso id. NON tocca staff, presenze, stato, qr.
// Uso:  cd scripts/firebase && npm install && node seed.mjs [--solo-pubblici] [--solo-espositori]
import { db, readJson, FieldValue } from './lib.mjs';
import { costruisciPubblico } from './pubblico.mjs';

const args = process.argv.slice(2);
const soloPubblici = args.includes('--solo-pubblici');
const soloEspositori = args.includes('--solo-espositori');
const mercati = readJson('data/seed/mercati.json').mercati;
const posteggi = readJson('data/seed/posteggi.json').posteggi;
const mappa = Object.fromEntries(readJson('data/seed/posteggi-mappa.json').posteggi.map(p => [p.id, p]));
const espositoriSeed = readJson('data/seed/espositori.json').espositori;

const docId = (id) => id.replace(/\//g, '_');   // "A-55/56" → "A-55_56"
const svgPts = (pts) => pts ? pts.map(([x, y]) => `${x},${y}`).join(' ') : null;

// v3: assegnazioni sul documento espositore
const assegn = {};
for (const p of posteggi) if (p.espositoreId) (assegn[p.espositoreId] ||= []).push(p.id);
export const normalizzaEspositore = (e) => {
  const spuntista = e.tipo === 'spuntista';
  const { tipo, ...rest } = e;
  return { ...rest, id: docId(e.id), tipo: spuntista ? 'spuntista' : 'fisso',
    qualifica: spuntista ? (e.qualifica || null) : (tipo && tipo !== 'fisso' ? tipo : e.qualifica || 'concessionario'),
    posteggi: spuntista ? [] : (assegn[e.id] || []), visibile: e.visibile !== false, attivo: e.attivo !== false,
    scadenza: e.scadenza || null, email: e.email || null };
};
const espositori = espositoriSeed.map(normalizzaEspositore);

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

if (!soloEspositori) {
  await batchWrite('mercati', mercati, m => ({ id: m.id, data: m }));
  const geom = (g) => g ? { pts: svgPts(g.pts), cx: g.cx, cy: g.cy, lat: g.lat, lon: g.lon, shape: g.shape || 'poly', r: g.r || null } : null;
  await batchWrite('posteggi', posteggi, p => {
    const { espositoreId, stato, ...rest } = p;   // v3: niente assegnatario sul posteggio
    return { id: p.id, data: { ...rest, mappa: geom(mappa[p.id]) } };
  });
  const extra = Object.values(mappa).filter(g => !posteggi.some(p => p.id === g.id));
  await batchWrite('posteggi', extra, g => ({ id: g.id, data: { id: g.id, mercato: 'area-mercatale', settore: g.settore, numero: g.numero,
    etichetta: `Settore ${g.settore} · n. ${g.numero}`, tipo: 'posteggio', inElenco: false, mappa: geom(g) } }));
  const IMP = { 'area-mercatale': { registroPresenze: true }, coperto: { registroPresenze: false }, ortofrutticolo: { registroPresenze: false } };
  for (const m of mercati) await db.collection('impostazioni').doc(m.id).set({ id: m.id, oraLimiteSpunta: '10:00', oraAzzeramento: '14:00', assenzeMassime: 20, ...IMP[m.id] }, { merge: true });
  console.log('impostazioni: 3 documenti (merge)');
}
await batchWrite('espositori', espositori, e => ({ id: e.id, data: e }));
if (!soloPubblici) {
  const riservati = readJson('data/seed/espositori_riservati.json').espositori;
  await batchWrite('espositori_riservati', riservati, r => ({ id: r.id, data: r }));
}
const post = (await db.collection('posteggi').get()).docs.map(d => d.data());
for (const [m, d] of Object.entries(costruisciPubblico(espositori, post))) await db.collection('pubblico').doc(m).set({ ...d, aggiornato: FieldValue.serverTimestamp() });
console.log('pubblico: 3 documenti · seed completato');
process.exit(0);
