# Area Mercatale Maglie — Contesto Progetto

## Descrizione
Ecosistema digitale per l'Area Mercatale di Maglie (LE, Puglia).
Composto da un microsito pubblico e una web app PWA con mappa interattiva delle postazioni.

## Struttura cartelle
mercatomaglie-site/
├── index.html          # Microsito one-page pubblico
├── img/                # Immagini webp del microsito
├── PIANO-V2.md         # Piano di sviluppo v2 (3 mercati, ruoli, QR)
├── docs/               # Documentazione (es. ARCHIVIO-targhe.md)
├── scripts/            # import-suap.py: PDF SUAP → data/seed/*.json
├── data/seed/          # Dati reali normalizzati (posteggi, espositori, mercati)
├── app-src/            # SVILUPPO — sorgenti React/Vite (modificare QUI)
│   ├── src/
│   │   ├── App.jsx     # Componente principale (UI, ~1180 righe)
│   │   ├── dati.js     # Livello dati: presenze/login Firebase + costruzione postazioni
│   │   ├── firebase.js # Init Firebase da .env.local (VITE_FIREBASE_*)
│   │   └── data/       # mappa.js + seed.js GENERATI da scripts/app/gen-data.py
│   ├── public/         # File statici: manifest, icone, _headers (CORS)
│   ├── index.html      # Entry point SORGENTE (punta a /src/main.jsx)
│   ├── vite.config.js  # build.outDir = '../app' (scrive direttamente in app/)
│   └── package.json
├── admin-src/          # SVILUPPO pannello di gestione desktop (React/Vite, stessa .env di app-src)
├── admin/              # PRODUZIONE pannello — output del build (…/areamercatale/admin/)
└── app/                # PRODUZIONE — output del build, committato e servito
    ├── index.html      # Entry point COMPILATO (generato dal build)
    ├── assets/         # JS/CSS COMPILATI con hash
    ├── sw.js / workbox-*.js / registerSW.js   # Service worker PWA
    └── (favicon, manifest, _headers, icone…)  # copiati da app-src/public/

NOTA STRUTTURALE (importante):
- Si modifica SOLO in `app-src/`. La cartella `app/` è interamente
  rigenerata dal build (`emptyOutDir: true`) — non modificarla a mano.
- `vite.config.js` ha `build.outDir: '../app'`: il build scrive già in `app/`,
  quindi NON serve più alcun `cp -r dist/* .` (workflow vecchio, rimosso).
- I file statici (favicon, manifest, _headers, icone) stanno in
  `app-src/public/` e vengono emessi automaticamente in `app/` dal build.

## Comandi principali
cd app-src && npm run build      # builda e scrive in ../app
cd admin-src && npm run build    # builda il pannello e scrive in ../admin
git add . && git commit -m "descrizione" && git push

## Stack tecnico
- Microsito: HTML/CSS/JS puro
- Web app: React + Vite, single file component (App.jsx)
- Font: Montserrat (Google Fonts)
- Storage: localStorage (migrazione Firebase pianificata)
- Deploy: GitHub → Plesk webhook automatico
- Hosting: 3seizero.com/projects/maglie/areamercatale/

## Palette colori
- Terra: #3d2b1a
- Ocra: #c8862a
- Ocra chiaro: #e8a045
- Sand: #f5f0e8
- Verde presenza: #3daa70
- Rosso assente: rgba(210,40,40,0.50)

## URL
- Microsito: https://3seizero.com/projects/maglie/areamercatale/
- Web app: https://3seizero.com/projects/maglie/areamercatale/app/
- GitHub: https://github.com/3seizero/mercatomaglie-site

## Note importanti
- App.jsx è un file singolo con tutti i componenti (in `app-src/src/App.jsx`)
- Le postazioni sono 262 con codici ufficiali (es. `A-86`, `D-13/14`, `PV-1`, `UOVA-1`):
  geometria in `app-src/src/data/mappa.js`, anagrafiche in `data/seed.js`, entrambi
  generati con `python3 scripts/app/gen-data.py` dai file in `data/` (rieseguire dopo
  ogni modifica ai seed o alla SVG). Nessun dato demo: espositori reali dagli elenchi SUAP.
- Presenze del giorno: documento Firestore `stato/{mercatoId}` ({data, presenti:{espId:{…}}}),
  letto dall'app pubblica (1 lettura per mercato); scrittura via `setPresenza` (solo staff).
  Login admin/operatore con Firebase Auth email+password e custom claim `role`.
- Pannello di gestione (`admin-src/`): espositori (pubblici + riservati), posteggi
  (assegna/libera/note), staff (creazione utenti con app Firebase secondaria, ruoli nel
  documento `staff/{uid}`), account (cambio password). Ogni salvataggio ricostruisce
  `pubblico/{mercato}` (riassunto letto dall'app pubblica in tempo reale, 1 doc/mercato).
  Le regole Firestore leggono il ruolo da `staff/{uid}` (fallback custom claim).
- Backend Firebase `mercati-maglie` (account Carlo): config in `app-src/.env.local`
  (non nel repo, copia da `.env.example`); script admin in `scripts/firebase/` (usano
  le credenziali `gcloud auth application-default login`, niente chiavi service account).
- Dopo ogni modifica ad App.jsx: `cd app-src && npm run build` → git push
  (il build scrive già in app/, niente più cp manuale)
- NON modificare i file dentro app/ direttamente: vengono rigenerati dal build
- La calibrazione GPS è implementata con 4 punti rilevati sul campo
- DATA_VERSION va incrementata quando cambiano i dati delle postazioni
- localStorage: solo eventi (`ev`) e `data_version`. Le presenze stanno su Firestore.
- Funzionalità TARGHE (simulatore accessi, campo targa, idea sbarra OCR):
  SOSPESA dal 15/09/2026 e rimossa dal codice. Archiviata nel tag git
  `v1-targhe` e documentata in `docs/ARCHIVIO-targhe.md`. Non reintrodurla
  senza richiesta esplicita.
- Dati reali SUAP (elenchi del 07/09/2026): `scripts/import-suap.py` legge i
  9 PDF in `../Library/Elenchi/` e genera `data/seed/*.json` + `REPORT.md`.
  `data/seed/espositori_riservati.json` (CF, P.IVA, indirizzi) è in .gitignore:
  il repo GitHub è PUBBLICO, quei dati non vanno mai committati.
- Piano v2 (3 mercati, ruoli admin/operatore, QR presenze): `PIANO-V2.md`
- Planimetria v2 (dal CAD del Comune, georeferenziata, codici ufficiali A-86…):
  `data/mappa/area-mercatale-v2.svg` + `data/seed/posteggi-mappa.json`, metodo e
  anomalie in `docs/MAPPA-V2.md`. In attesa di revisione di Carlo; la calibrazione
  GEO dell'app resta valida (stesso sistema di coordinate).

## Prossimi sviluppi pianificati
- [x] Firebase Firestore (presenze; anagrafiche ancora dal bundle)
- [x] Firebase Authentication (email/password + ruoli)
- [x] Pannello admin desktop (espositori, posteggi, staff, password) — 22/09/2026
- [ ] QR: token per espositore, stampa PDF, scanner operatore, scheda pubblica da QR
- [ ] Foto espositori (richiede piano Blaze per Storage)
- [ ] Firebase Push Notifications
- [ ] (sospeso) OCR/sbarra targhe — vedi docs/ARCHIVIO-targhe.md
- [ ] Share API e Contacts API
- [ ] Dominio dedicato mercatomaglie.it
- [ ] Admin panel separato
