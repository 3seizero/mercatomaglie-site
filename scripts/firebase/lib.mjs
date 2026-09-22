import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import admin from 'firebase-admin';

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(here, '..', '..');
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'mercati-maglie';
const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT || join(here, 'serviceAccount.json');

// Due modi di autenticarsi, in ordine di preferenza:
// 1) Application Default Credentials dell'utente (`gcloud auth application-default login`): nessuna chiave su disco.
// 2) Chiave di service account in scripts/firebase/serviceAccount.json (se l'organizzazione lo consente).
if (existsSync(keyPath)) {
  const cred = JSON.parse(readFileSync(keyPath, 'utf8'));
  admin.initializeApp({ credential: admin.credential.cert(cred), projectId: cred.project_id });
} else {
  const adc = join(process.env.HOME || '', '.config', 'gcloud', 'application_default_credentials.json');
  if (!existsSync(adc) && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('Nessuna credenziale trovata. Esegui una volta:\n  gcloud auth application-default login --project ' + PROJECT_ID +
      '\noppure salva una chiave di service account in ' + keyPath);
    process.exit(1);
  }
  admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: PROJECT_ID });
}
export const db = admin.firestore();
export const auth = admin.auth();
export const readJson = (rel) => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
export const FieldValue = admin.firestore.FieldValue;
