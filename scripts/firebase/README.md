# Script Firebase (progetto `mercati-maglie`)

Autenticazione senza chiavi su disco (consigliata):

    gcloud auth login                                   # una volta, apre il browser
    gcloud auth application-default login --project mercati-maglie   # credenziali per firebase-admin

Regole Firestore (usa le credenziali gcloud, niente Firebase CLI):

    node deploy-rules.mjs

Dati e ruoli (da `scripts/firebase/`):

    npm install
    node seed.mjs                     # carica mercati, posteggi, espositori (+ riservati)
    node set-role.mjs carlo@3seizero.com admin <password-iniziale>
    node set-role.mjs operatore@esempio.it operatore

In alternativa, se l'organizzazione consente le chiavi di service account, salvare la chiave in
`scripts/firebase/serviceAccount.json` (ignorata da git): gli script la usano automaticamente.

## Modello v3 (23/09/2026)

- `pubblico.mjs`: costruzione dei riassunti `pubblico/{mercato}` (stessa logica di `admin-src/src/api.js`).
- `migra-v3.mjs [--dry-run]`: migrazione al modello espositore-centrico (già eseguita; idempotente).
- `seed.mjs [--solo-pubblici] [--solo-espositori]`: carica i seed nel formato v3 (posteggi senza assegnatario,
  espositori con `posteggi[]`, impostazioni con i default). Non tocca staff, presenze, stato, qr.
- Le regole in `firestore.rules` si pubblicano con `deploy-rules.mjs`.
