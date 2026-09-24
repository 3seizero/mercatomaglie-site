// Importa nel progetto corrente (FIREBASE_PROJECT_ID) l'export di esporta-progetto.mjs: collezioni Firestore e utenti Auth
// (ricreati con password nuove, generate qui e stampate UNA volta). Gli uid cambiano: staff/{uid} e i riferimenti
// operatore.uid nelle presenze vengono rimappati.
// Uso: FIREBASE_PROJECT_ID=mercati-maglie-app node importa-progetto.mjs <cartella-export>
import { db, auth } from './lib.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import admin from 'firebase-admin';
const dir = process.argv[2]; if (!dir) { console.error('cartella?'); process.exit(1); }
const dec = (v) => {
  if (v && typeof v === 'object' && '__ts' in v) return admin.firestore.Timestamp.fromDate(new Date(v.__ts));
  if (Array.isArray(v)) return v.map(dec);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, dec(x)]));
  return v;
};
const gen = () => 'Mm' + Math.random().toString(36).slice(2, 8) + '-' + Math.floor(1000 + Math.random() * 9000);
// 1. utenti Auth
const vecchi = JSON.parse(readFileSync(join(dir, 'auth-users.json'), 'utf8'));
const mappa = {}; const password = {};
for (const u of vecchi) {
  let rec = null; try { rec = await auth.getUserByEmail(u.email); } catch { rec = null; }
  if (!rec) { const pw = gen(); rec = await auth.createUser({ email: u.email, password: pw, displayName: u.displayName || undefined, disabled: !!u.disabled }); password[u.email] = pw; }
  if (u.claims && Object.keys(u.claims).length) await auth.setCustomUserClaims(rec.uid, u.claims);
  mappa[u.uid] = rec.uid;
}
const remap = (v) => {
  if (Array.isArray(v)) return v.map(remap);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === 'uid' && typeof x === 'string' && mappa[x] ? mappa[x] : remap(x)]));
  return v;
};
// 2. collezioni
const COLL = ['mercati', 'posteggi', 'espositori', 'espositori_riservati', 'pubblico', 'stato', 'presenze', 'staff', 'qr', 'richieste', 'impostazioni', 'calendario', 'eventi'];
const riepilogo = {};
for (const c of COLL) {
  const f = join(dir, `${c}.json`); if (!existsSync(f)) continue;
  const docs = JSON.parse(readFileSync(f, 'utf8'));
  let b = db.batch(); let n = 0;
  for (const d of docs) {
    const id = c === 'staff' ? (mappa[d.id] || d.id) : d.id;
    b.set(db.collection(c).doc(id), remap(dec(d.data)));
    if (++n === 400) { await b.commit(); b = db.batch(); n = 0; }
  }
  if (n) await b.commit();
  riepilogo[c] = docs.length;
}
console.log(JSON.stringify(riepilogo));
console.log('UTENTI (uid vecchio -> nuovo):', JSON.stringify(mappa));
console.log('PASSWORD NUOVE (comunicare e poi cambiare):', JSON.stringify(password, null, 1));
process.exit(0);
