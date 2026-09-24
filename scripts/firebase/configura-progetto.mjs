// Configura il progetto Firebase: domini autorizzati per Auth e restrizioni della chiave web (referrer + API).
// Uso: FIREBASE_PROJECT_ID=mercati-maglie-app node configura-progetto.mjs <apiKey>
import { GoogleAuth } from 'google-auth-library';
const PROJECT = process.env.FIREBASE_PROJECT_ID; const KEY = process.argv[2];
const DOMINI = ['localhost', `${PROJECT}.firebaseapp.com`, `${PROJECT}.web.app`, 'mercati.visitmaglie.com', '3seizero.com', 'www.3seizero.com'];
const REFERRER = ['https://mercati.visitmaglie.com/*', 'https://*.visitmaglie.com/*', 'https://3seizero.com/*', 'https://*.3seizero.com/*',
  'http://localhost:5199/*', 'http://localhost:5198/*', 'http://localhost:5173/*', 'http://localhost:4173/*', 'http://localhost/*', 'http://127.0.0.1:5199/*', 'http://127.0.0.1:5198/*', 'http://127.0.0.1/*'];
const API = ['identitytoolkit.googleapis.com', 'securetoken.googleapis.com', 'firestore.googleapis.com', 'firebaseinstallations.googleapis.com', 'firebasestorage.googleapis.com', 'fcm.googleapis.com', 'firebase.googleapis.com', 'firebaseremoteconfig.googleapis.com'];
const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase'] });
const c = await auth.getClient();
const call = async (method, url, data, params) => (await c.request({ method, url, data, params })).data;
// 1. domini autorizzati Auth
const cfg = await call('PATCH', `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT}/config`, { authorizedDomains: DOMINI }, { updateMask: 'authorizedDomains' });
console.log('domini autorizzati:', cfg.authorizedDomains.join(', '));
// 2. chiave web: trova per keyString e aggiorna restrizioni
const keys = await call('GET', `https://apikeys.googleapis.com/v2/projects/${PROJECT}/locations/global/keys`);
let target = null;
for (const k of keys.keys || []) { const s = await call('GET', `https://apikeys.googleapis.com/v2/${k.name}/keyString`); if (s.keyString === KEY) { target = k; break; } }
if (!target) { console.error('chiave non trovata'); process.exit(1); }
const op = await call('PATCH', `https://apikeys.googleapis.com/v2/${target.name}`, { restrictions: { browserKeyRestrictions: { allowedReferrers: REFERRER }, apiTargets: API.map((s) => ({ service: s })) } }, { updateMask: 'restrictions' });
console.log('chiave', target.displayName || target.uid, 'aggiornata:', op.done ? 'ok' : 'operazione avviata ' + op.name);
process.exit(0);
