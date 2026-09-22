import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import admin from 'firebase-admin';

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(here, '..', '..');
const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT || join(here, 'serviceAccount.json');
if (!existsSync(keyPath)) {
  console.error(`Manca la chiave del service account: ${keyPath}\n` +
    'Console Firebase → Impostazioni progetto → Account di servizio → Genera nuova chiave privata, salvala come scripts/firebase/serviceAccount.json');
  process.exit(1);
}
const cred = JSON.parse(readFileSync(keyPath, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(cred), projectId: cred.project_id });
export const db = admin.firestore();
export const auth = admin.auth();
export const readJson = (rel) => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
export const FieldValue = admin.firestore.FieldValue;
