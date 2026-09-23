// Migrazione al modello v3 (PIANO-V3.md) sui dati esistenti in Firestore. Idempotente.
//  1. espositori: `tipo` fisso|spuntista (la vecchia qualifica va in `qualifica`), `posteggi[]` dalle assegnazioni
//     dei documenti posteggi, `visibile`, `attivo`, `scadenza`, `email`.
//  2. posteggi: rimossi `espositoreId` e `stato`.
//  3. spuntisti dell'elenco SUAP (data/seed) aggiunti se mancanti (pubblici + riservati).
//  4. impostazioni/{mercato} con i default (merge, non sovrascrive valori già impostati).
//  5. staff: aggiunti cognome, telefono, attivo se mancanti.
//  6. presenze di prova del vecchio formato ({data}_{esp}) e stato del giorno azzerati.
//  7. pubblico/{mercato} ricostruito.
// Uso: cd scripts/firebase && node migra-v3.mjs [--dry-run]
import { db, readJson, FieldValue } from './lib.mjs';
import { costruisciPubblico } from './pubblico.mjs';

const dry = process.argv.includes('--dry-run');
const docId = (id) => String(id).replace(/\//g, '_');
const log = (...a) => console.log(dry ? '[dry-run]' : '', ...a);

const espDocs = await db.collection('espositori').get();
const postDocs = await db.collection('posteggi').get();
const espositori = espDocs.docs.map(d => ({ _ref: d.ref, ...d.data() }));
const posteggi = postDocs.docs.map(d => ({ _ref: d.ref, ...d.data() }));

// 1 + 2: assegnazioni dal posteggio all'espositore
const assegn = {};
for (const p of posteggi) if (p.espositoreId) (assegn[p.espositoreId] ||= []).push(p.id);
let b = db.batch(); let n = 0;
const flush = async () => { if (n && !dry) await b.commit(); b = db.batch(); n = 0; };
const add = async (fn) => { fn(b); if (++n >= 400) await flush(); };

for (const e of espositori) {
  const spuntista = e.tipo === 'spuntista';
  const vecchioTipo = e.tipo && !['fisso', 'spuntista'].includes(e.tipo) ? e.tipo : null;
  const upd = {
    tipo: spuntista ? 'spuntista' : 'fisso',
    qualifica: e.qualifica || vecchioTipo || (spuntista ? null : 'concessionario'),
    posteggi: spuntista ? [] : [...new Set([...(e.posteggi || []), ...(assegn[e.id] || [])])],
    visibile: e.visibile !== false, attivo: e.attivo !== false, scadenza: e.scadenza || null, email: e.email || null,
    _aggiornato: FieldValue.serverTimestamp(),
  };
  await add((bb) => bb.set(e._ref, upd, { merge: true }));
}
log('espositori aggiornati:', espositori.length, '· con posteggi:', Object.keys(assegn).length);
for (const p of posteggi) if ('espositoreId' in p || 'stato' in p) await add((bb) => bb.update(p._ref, { espositoreId: FieldValue.delete(), stato: FieldValue.delete(), _aggiornato: FieldValue.serverTimestamp() }));
log('posteggi ripuliti da espositoreId/stato');
await flush();

// 3: spuntisti dal seed
const seedPub = readJson('data/seed/espositori.json').espositori.filter(e => e.tipo === 'spuntista');
const seedRis = Object.fromEntries(readJson('data/seed/espositori_riservati.json').espositori.map(r => [r.id, r]));
const esistenti = new Set(espositori.map(e => e.id));
let nuovi = 0;
for (const s of seedPub) {
  if (esistenti.has(s.id)) continue;
  const pub = { ...s, id: docId(s.id), tipo: 'spuntista', qualifica: null, posteggi: [], visibile: s.visibile !== false, attivo: true, scadenza: s.scadenza || null, email: null, _aggiornato: FieldValue.serverTimestamp() };
  await add((bb) => bb.set(db.collection('espositori').doc(docId(s.id)), pub));
  if (seedRis[s.id]) await add((bb) => bb.set(db.collection('espositori_riservati').doc(docId(s.id)), { ...seedRis[s.id], _aggiornato: FieldValue.serverTimestamp() }, { merge: true }));
  nuovi++;
}
await flush();
log('spuntisti aggiunti:', nuovi, 'su', seedPub.length);

// 4: impostazioni
const IMP = { 'area-mercatale': { registroPresenze: true }, coperto: { registroPresenze: false }, ortofrutticolo: { registroPresenze: false } };
for (const m of Object.keys(IMP)) {
  const ref = db.collection('impostazioni').doc(m);
  const cur = (await ref.get()).data() || {};
  const val = { id: m, oraLimiteSpunta: '10:00', oraAzzeramento: '14:00', assenzeMassime: 20, ...IMP[m], ...cur, _aggiornato: FieldValue.serverTimestamp() };
  if (!dry) await ref.set(val, { merge: true });
}
log('impostazioni: ok');

// 5: staff
const staff = await db.collection('staff').get();
for (const d of staff.docs) {
  const s = d.data();
  const upd = {};
  if (s.cognome === undefined) upd.cognome = '';
  if (s.telefono === undefined) upd.telefono = '';
  if (s.attivo === undefined) upd.attivo = true;
  if (Object.keys(upd).length && !dry) await d.ref.set(upd, { merge: true });
}
log('staff aggiornati:', staff.size);

// 6: presenze di prova del vecchio formato e stato del giorno
const pres = await db.collection('presenze').get();
let vecchie = 0;
for (const d of pres.docs) if (d.id.split('_').length === 2 || d.data().presente !== undefined) { vecchie++; if (!dry) await d.ref.delete(); }
for (const m of Object.keys(IMP)) if (!dry) await db.collection('stato').doc(m).set({ data: null, presenti: {}, aggiornato: FieldValue.serverTimestamp() });
log('presenze vecchio formato eliminate:', vecchie, '· stato azzerato');

// 7: pubblico
const esp2 = (await db.collection('espositori').get()).docs.map(d => d.data());
const post2 = (await db.collection('posteggi').get()).docs.map(d => d.data());
for (const [m, d] of Object.entries(costruisciPubblico(esp2, post2))) {
  if (!dry) await db.collection('pubblico').doc(m).set({ ...d, aggiornato: FieldValue.serverTimestamp() });
  log('pubblico', m, Object.keys(d.espositori).length, 'espositori,', Object.values(d.posteggi).filter(p => p.espositoreId).length, 'posteggi assegnati su', Object.keys(d.posteggi).length);
}
console.log(dry ? 'dry-run completato (nessuna scrittura)' : 'migrazione v3 completata');
process.exit(0);
