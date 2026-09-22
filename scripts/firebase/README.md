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
