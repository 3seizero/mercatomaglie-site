# Area Mercatale Maglie — Contesto Progetto

## Descrizione
Ecosistema digitale per l'Area Mercatale di Maglie (LE, Puglia).
Composto da un microsito pubblico e una web app PWA con mappa interattiva delle postazioni.

## Struttura cartelle
mercatomaglie-site/
├── index.html          # Microsito one-page pubblico
├── img/                # Immagini webp del microsito
├── app/                # Web app PWA React (file compilati da Vite)
│   ├── index.html      # Entry point compilato
│   ├── assets/         # JS/CSS compilati
│   ├── site.webmanifest
│   └── public/         # Sorgenti statici (NON modificare direttamente)
└── app-src/            # Sorgenti React (modificare qui)
    ├── src/
    │   └── App.jsx     # Componente principale
    ├── public/         # File statici (manifest, icone)
    ├── vite.config.js
    └── package.json

## Comandi principali
cd app-src && npm run build
cp -r app-src/dist/* app/
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
- App.jsx è un file singolo con tutti i componenti
- Le postazioni sono 251 (P001-P251), 50 con dati demo
- Dopo ogni modifica ad App.jsx: build → cp dist → git push
- NON modificare i file dentro app/ direttamente
- La calibrazione GPS è implementata con 4 punti rilevati sul campo
- DATA_VERSION va incrementata quando cambiano i dati delle postazioni

## Prossimi sviluppi pianificati
- [ ] Firebase Firestore
- [ ] Firebase Authentication
- [ ] Firebase Push Notifications
- [ ] OCR targhe sezione admin
- [ ] Share API e Contacts API
- [ ] Dominio dedicato mercatomaglie.it
- [ ] Admin panel separato
