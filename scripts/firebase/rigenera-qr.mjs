// Revoca TUTTI i token QR esistenti e ne genera uno nuovo per ogni espositore attivo (fissi e spuntisti).
// I QR stampati in precedenza smettono di funzionare. Uso: node rigenera-qr.mjs [--dry-run]
import { db, FieldValue } from './lib.mjs';
import { randomBytes } from 'node:crypto';
const dry = process.argv.includes('--dry-run');
const docId = (id) => String(id).replace(/\//g, '_');
const nuovoToken = () => randomBytes(15).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const qr = await db.collection('qr').get();
const esp = (await db.collection('espositori').get()).docs.map((d) => d.data()).filter((e) => e.attivo !== false);
let b = db.batch(); let n = 0; const flush = async () => { if (n && !dry) await b.commit(); b = db.batch(); n = 0; };
const add = async (fn) => { fn(b); if (++n >= 400) await flush(); };
let revocati = 0;
for (const d of qr.docs) if (d.data().attivo !== false) { revocati++; await add((bb) => bb.set(d.ref, { attivo: false, revocato: FieldValue.serverTimestamp(), motivo: 'rigenerazione totale 24/09/2026 (nuovo dominio)' }, { merge: true })); }
let generati = 0;
for (const e of esp) {
  const token = nuovoToken();
  await add((bb) => bb.set(db.collection('qr').doc(token), { espositoreId: e.id, attivo: true, creato: FieldValue.serverTimestamp() }));
  await add((bb) => bb.set(db.collection('espositori_riservati').doc(docId(e.id)), { id: e.id, qrToken: token, qrCreato: FieldValue.serverTimestamp() }, { merge: true }));
  generati++;
}
await flush();
console.log(`${dry ? '[dry-run] ' : ''}token revocati: ${revocati} · nuovi token: ${generati} (espositori attivi)`);
process.exit(0);
