// Esporta tutte le collezioni Firestore e gli utenti Auth (senza password) del progetto corrente in JSON.
// Uso: FIREBASE_PROJECT_ID=mercati-maglie node esporta-progetto.mjs <cartella-destinazione>
import { db, auth } from './lib.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import admin from 'firebase-admin';
const out = process.argv[2]; if (!out) { console.error('cartella?'); process.exit(1); } mkdirSync(out, { recursive: true });
const COLL = ['mercati', 'posteggi', 'espositori', 'espositori_riservati', 'pubblico', 'stato', 'presenze', 'staff', 'qr', 'richieste', 'impostazioni', 'calendario', 'eventi'];
const enc = (v) => {
  if (v instanceof admin.firestore.Timestamp) return { __ts: v.toDate().toISOString() };
  if (Array.isArray(v)) return v.map(enc);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)]));
  return v;
};
const riepilogo = {};
for (const c of COLL) {
  const snap = await db.collection(c).get();
  const docs = snap.docs.map((d) => ({ id: d.id, data: enc(d.data()) }));
  writeFileSync(join(out, `${c}.json`), JSON.stringify(docs));
  riepilogo[c] = docs.length;
}
const utenti = []; let tok;
do { const r = await auth.listUsers(1000, tok); utenti.push(...r.users.map((u) => ({ uid: u.uid, email: u.email, displayName: u.displayName || null, disabled: u.disabled, claims: u.customClaims || null }))); tok = r.pageToken; } while (tok);
writeFileSync(join(out, 'auth-users.json'), JSON.stringify(utenti, null, 1));
riepilogo['auth-users'] = utenti.length;
console.log(JSON.stringify(riepilogo));
process.exit(0);
