# Chiave Firebase nel bundle pubblico

**Chiave:** `Browser key (auto created by Firebase)` del progetto Google Cloud `mercati-maglie`
(id `3313fe37-c241-40b1-8e81-bd915c699b1c`). È la `VITE_FIREBASE_API_KEY` di `app-src/.env.local`
e finisce nel JS compilato in `app/assets/` e `admin/assets/`.

## Perché non è un segreto
La Firebase Web API key è un identificatore di progetto, non una credenziale: serve al SDK
per sapere a quale progetto rivolgersi. Per design sta nel codice del browser ed è visibile
a chiunque. La sicurezza dei dati è nelle regole Firestore (`firestore.rules`) e in Firebase
Authentication, non nella segretezza della chiave. Non va ruotata né rimossa dal bundle.
L'alert GitHub "Google API Key" (secret scanning #1, 22/09/2026) è stato chiuso come falso positivo.

## Restrizioni applicate (22/09/2026)
- **API consentite:** identitytoolkit, securetoken, firestore, firebaseinstallations,
  firebasestorage, fcm, firebase, firebaseremoteconfig (tutte `*.googleapis.com`).
- **Referrer HTTP consentiti:** `https://3seizero.com/*`, `https://*.3seizero.com/*`,
  `http://localhost:*/*`, `http://127.0.0.1:*/*`, `https://mercati-maglie.firebaseapp.com/*`,
  `https://mercati-maglie.web.app/*`.

## Dove modificarle
Console Google Cloud → progetto `mercati-maglie` → **API e servizi → Credenziali** → chiave
"Browser key (auto created by Firebase)". Oppure da terminale:
`gcloud services api-keys update <NAME> --project mercati-maglie --allowed-referrers=... --api-target=service=...`
(l'elenco passato sostituisce quello esistente).

## Se cambia il dominio
Se l'app viene servita da un nuovo dominio (es. `mercatomaglie.it`), aggiungere
`https://mercatomaglie.it/*` e `https://*.mercatomaglie.it/*` ai referrer **prima** del deploy,
altrimenti login e Firestore falliranno con errore 403 / `auth/requests-from-referer-blocked`.
Aggiungere lo stesso dominio anche in Firebase Console → Authentication → Settings → Domini autorizzati.
