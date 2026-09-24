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
- Hosting: mercati.visitmaglie.com (vedi URL); vecchio 3seizero.com/projects/maglie/areamercatale/

## Palette colori
- Terra: #3d2b1a
- Ocra: #c8862a
- Ocra chiaro: #e8a045
- Sand: #f5f0e8
- Verde presenza: #3daa70
- Rosso assente: rgba(210,40,40,0.50)

## URL
- PRODUZIONE (dal 24/09/2026): https://mercati.visitmaglie.com/ (sito), /app/ (web app), /admin/ (pannello)
  Server Plesk 57.128.29.118 (`ssh debian@57.128.29.118`), subscription visitmaglie.com su IP 178.32.137.44,
  deploy GitHub → webhook Plesk (estensione Git, deployment path `/mercati.visitmaglie.com` relativo alla home).
- Vecchio indirizzo: https://3seizero.com/projects/maglie/areamercatale/ (+ /app/, /admin/): riceve ancora i deploy;
  diventerà un redirect 301 verso il nuovo dominio (i QR già stampati puntano lì). Le build usano `base: './'`.
- GitHub: https://github.com/3seizero/mercatomaglie-site

## Note importanti
- App.jsx è un file singolo con tutti i componenti (in `app-src/src/App.jsx`)
- Le postazioni sono 262 con codici ufficiali (es. `A-86`, `D-13/14`, `PV-1`, `UOVA-1`):
  geometria in `app-src/src/data/mappa.js`, anagrafiche in `data/seed.js` (v3: espositori con `posteggi[]`),
  entrambi generati con `python3 scripts/app/gen-data.py` dai file in `data/` (rieseguire dopo
  ogni modifica ai seed o alla SVG). Nessun dato demo: 175 fissi + 52 spuntisti reali dagli elenchi SUAP.
  Migrazione Firestore al modello v3 già eseguita il 23/09/2026 (`scripts/firebase/migra-v3.mjs`, idempotente).
- MODELLO v3 (23/09/2026, vedi PIANO-V3.md): l'indice è l'ESPOSITORE. `espositori/{id}` ha `tipo` fisso|spuntista,
  `qualifica` (concessionario/produttore/…), `posteggi[]` (id dei posteggi assegnati, anche più di uno), `visibile`
  (privacy), `attivo`, `scadenza`, `email`. I documenti `posteggi` NON hanno più `espositoreId`/`stato`.
  `pubblico/{mercato}` (costruito da `costruisciPubblico`, STESSA logica in scripts/firebase/pubblico.mjs e in
  admin-src/src/api.js) mantiene `posteggi:{id:{espositoreId,stato,note}}` derivati, così l'app resta semplice.
  Un'unica anagrafica per fissi e spuntisti (stessi campi); gli spuntisti hanno posteggi [] e ricevono il posteggio
  dall'operatore giorno per giorno. Seed spuntisti: `scripts/import-suap.py --solo-spuntisti` (il re-import completo
  sovrascrive le correzioni manuali a posteggi/mercati/fissi: NON usarlo).
- Presenze del giorno: `stato/{mercatoId}` ({data, presenti:{espId:{posteggioId, ora, metodo, da:{uid,nome,cognome},
  tipo, ritardo}}}), letto dall'app (1 lettura per mercato). Record certificato: `presenze/{data}_{mercato}_{espId}`
  (operatore, GPS, metodo qr|elenco; annullamento = `annullata:true`, la riga resta). Scrittura via
  `setPresenza` (solo staff). `impostazioni/{mercato}`: registroPresenze (coperto e ortofrutticolo: false),
  oraLimiteSpunta 10:00 (dopo: i fissi non presentati sono assenti e NON più registrabili; i loro posteggi vanno agli spuntisti),
  oraAzzeramento 14:00 (dopo: l'app mostra tutti assenti), assenzeMassime 18 = assenze CONSECUTIVE (contatore
  `espositori.{id}.assenze` ricalcolato dal pannello, funzione `ricalcolaContatori` in admin-src/src/App.jsx).
  Scadenza fissi 31/12/2040 (default per i nuovi). `calendario/{mercato}_{data}`:
  giornate soppresse/spostate/straordinarie (avviso nell'app; il report conta le assenze solo sulle giornate svolte).
- Login staff con Firebase Auth email+password; ruolo e anagrafica (nome, cognome, telefono, attivo) in `staff/{uid}`.
  `staff/{uid}.cambioPassword: true` = cambio password obbligatorio al prossimo accesso (impostato alla creazione
  dell'utente e dal pulsante "Richiedi cambio" in Staff; pannello e app bloccano tutto finché non viene cambiata;
  l'utente può azzerare solo quel campo, regola dedicata).
  Le regole leggono `'role' in request.auth.token` (claim) altrimenti il documento staff: NON usare
  `request.auth.token.role != null` (errore sui claim assenti → permesso negato).
- Pannello di gestione (`admin-src/`, admin e suap): espositori fissi/spuntisti (pubblici + riservati, QR, più
  posteggi), posteggi, richieste, report presenze (filtri periodo/espositore/posteggio/operatore, riepilogo con
  assenze e soglia, registro; export Excel via `xlsx` e PDF via stampa: `src/report.js`), impostazioni e calendario,
  mercati e staff (solo admin), account. Ogni salvataggio ricostruisce `pubblico/{mercato}`.
  App pubblica, pagina Gestione = operatore di controllo (ruoli operatore e admin; il suap NON registra presenze, regole comprese): presenze fissi (elenco o QR), spuntisti (assegna
  posteggio libero), scanner. La scheda QR `#/v/<token>` senza login mostra solo "codice valido" + accesso.
- Backend Firebase `mercati-maglie-app` (dal 24/09/2026; account dedicato mercatimaglie@gmail.com, fuori
  dall'organizzazione 3seizero: niente policy di dominio né scadenza giornaliera delle credenziali). Config in
  `app-src/.env.local` (non nel repo, copia da `.env.example`); script admin in `scripts/firebase/` con le
  credenziali `gcloud auth login mercatimaglie@gmail.com --update-adc` + `set-quota-project mercati-maglie-app`.
  Il vecchio progetto `mercati-maglie` (org 3seizero) resta come backup congelato: non scriverci.
  Migrazione: `esporta-progetto.mjs` → `importa-progetto.mjs` (utenti Auth ricreati con password nuove,
  uid rimappati) → `deploy-rules.mjs` → `configura-progetto.mjs <apiKey>` (domini Auth + referrer chiave).
- Compatibilità browser vecchi (24/09/2026): app e pannello usano `@vitejs/plugin-legacy` con `modernTargets`
  Chrome 64 / Safari 12 (senza questa opzione il plugin lascia il bundle moderno a Chrome 105 e i tablet Android
  del 2018 mostrano una pagina bianca) più bundle legacy per Chrome 60-63. Il microsito evita `gap` nel menu,
  ha fallback per `inset`, `clamp()`, `aspect-ratio` e la classe `no-flexgap` impostata da JS.
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
- [x] QR (22/09/2026): token in `qr/{token}` + `espositori_riservati.qrToken`, generazione/
  rigenerazione/revoca e stampa (griglia A4) dal pannello; nell'app `#/v/<token>` apre la
  scheda (`src/qr.jsx`), lo staff conferma la presenza (metodo qr + posizione GPS),
  scanner con BarcodeDetector nativo o jsQR
- [x] Orari mercati (22/09/2026): area sabato 6-13, ortofrutticolo mercoledì 6-13, coperto tutti
  i giorni 6-13, in `mercati.json` (giorniSettimana/apertura/chiusura) e Firestore `mercati`;
  modificabili dal pannello (pagina Mercati, solo admin; l'app li legge live con `useMercati()`);
  `mercatoAperto()` in dati.js: fuori orario la mappa mostra "Mercato chiuso · apre …" e le
  postazioni assegnate in colore neutro (niente rosso)
- [x] Scheda self-service (22/09/2026): dal QR l'espositore propone alias/contatti/descrizione con
  consenso → `richieste/` → pannello "Richieste" (suap/admin) approva campo per campo e pubblica
- [~] Foto espositori: codice pronto ma NASCOSTO (flag `VITE_FOTO=1` in .env.local + piano Blaze
  per Storage). Admin: sezione foto nella scheda (max 3, ridotte a 1200px); app: galleria nel popup
- Utenti di prova creati il 22/09/2026: suap.test@3seizero.com (suap), operatore.test@3seizero.com
  (operatore); password comunicate a Carlo in chat, non salvate nel repo
- Chiave web Firebase: limitata (API Firebase + referrer 3seizero.com e localhost:5199/5198/5173);
  vedi docs/SICUREZZA-CHIAVE-FIREBASE.md. Nuovi domini o porte dev vanno aggiunti ai referrer.
- [x] Modello v3 (23/09/2026): espositore-centrico, spuntisti, ruoli con anagrafica, impostazioni, calendario,
  presenze certificate, report Excel/PDF. Manca: certificazione/sigillo di fine giornata (PIANO-V3 §4).
- [ ] Firebase Push Notifications
- [ ] (sospeso) OCR/sbarra targhe — vedi docs/ARCHIVIO-targhe.md
- [ ] Share API e Contacts API
- [ ] Dominio dedicato mercatomaglie.it
- [ ] Admin panel separato
