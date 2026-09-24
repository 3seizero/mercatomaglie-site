// Pubblica firestore.rules tramite l'API Firebase Rules usando le Application Default Credentials (gcloud).
// Uso: node deploy-rules.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleAuth } from 'google-auth-library';

const here = dirname(fileURLToPath(import.meta.url));
const PROJECT = process.env.FIREBASE_PROJECT_ID || 'mercati-maglie-app';
const rules = readFileSync(join(here, '..', '..', 'firestore.rules'), 'utf8');
const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase'] });
const client = await auth.getClient();
const base = `https://firebaserules.googleapis.com/v1/projects/${PROJECT}`;
const call = async (method, url, body) => {
  const r = await client.request({ method, url, data: body });
  return r.data;
};
// 1) validazione
const test = await call('POST', `${base}:test`, { source: { files: [{ name: 'firestore.rules', content: rules }] } });
if (test.issues?.some(i => i.severity === 'ERROR')) { console.error('Errori nelle regole:', JSON.stringify(test.issues, null, 2)); process.exit(1); }
if (test.issues?.length) console.warn('Avvisi:', JSON.stringify(test.issues, null, 2));
// 2) ruleset
const rs = await call('POST', `${base}/rulesets`, { source: { files: [{ name: 'firestore.rules', content: rules }] } });
console.log('ruleset creato', rs.name);
// 3) release cloud.firestore (crea o aggiorna)
const releaseName = `projects/${PROJECT}/releases/cloud.firestore`;
try {
  await call('PATCH', `https://firebaserules.googleapis.com/v1/${releaseName}`, { release: { name: releaseName, rulesetName: rs.name } });
  console.log('release aggiornata');
} catch (e) {
  if (e.response?.status === 404) { await call('POST', `${base}/releases`, { name: releaseName, rulesetName: rs.name }); console.log('release creata'); }
  else throw e;
}
console.log('regole Firestore pubblicate su', PROJECT);
