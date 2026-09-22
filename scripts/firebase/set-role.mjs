// Crea (se manca) un utente email/password e gli assegna un ruolo tramite custom claim.
// Uso:  node set-role.mjs <email> <admin|operatore|suap|nessuno> [password-iniziale]
import { auth, db } from './lib.mjs';
const [email, ruolo, password] = process.argv.slice(2);
if (!email || !ruolo) { console.error('uso: node set-role.mjs <email> <admin|operatore|suap|nessuno> [password]'); process.exit(1); }
let user;
try { user = await auth.getUserByEmail(email); }
catch { user = await auth.createUser({ email, password: password || Math.random().toString(36).slice(2, 12) + 'A1!', emailVerified: true }); console.log('utente creato', user.uid); }
const role = ruolo === 'nessuno' ? null : ruolo;
await auth.setCustomUserClaims(user.uid, role ? { role } : {});
await db.collection('staff').doc(user.uid).set({ email, role, aggiornato: new Date().toISOString() });
console.log(`${email} → ruolo ${role ?? 'nessuno'} (uid ${user.uid}). L'utente deve rifare il login per vedere il nuovo ruolo.`);
process.exit(0);
