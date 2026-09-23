# Prompt per Claude Code - nuovo marchio Area Mercatale

Copia il testo qui sotto in Claude Code, dopo aver copiato la cartella `marchio/` di questo pacchetto nel repository (per esempio in `brand/marchio/`).

---

Nel repository c'è il progetto Area Mercatale di Maglie: la web app React (in `app-src/`, sorgente principale `app-src/src/App.jsx`) e il microsito (`index.html`). Dobbiamo sostituire il vecchio logo (portale con tende e sole a tratto, `app/logo.svg`) con il nuovo marchio che trovi in `brand/marchio/`. Leggi prima `brand/marchio/README.md`: contiene colori, file e regole d'uso.

Cosa fare:

1. Esplora il codice e fai l'elenco di tutti i punti in cui compare il logo o il lettering "AREA MERCATALE / MAGLIE": header dell'app, schermata iniziale o splash, microsito (header, footer, meta), favicon, manifest PWA, icone iOS, eventuali og:image. Mostrami l'elenco prima di modificare.
2. Copia gli asset necessari nelle cartelle pubbliche già usate dal progetto (non creare nuove convenzioni):
   - header scuro (fondo terra #3d2b1a): `svg/lockup/lockup-orizzontale-negativo.svg`, altezza 36-44 px;
   - header o sezioni su fondo chiaro: `svg/lockup/lockup-orizzontale-colore.svg`;
   - spazi stretti (sotto 240 px di larghezza): solo il segno, `svg/marchio/marchio-negativo-su-terra.svg` o `marchio-colore.svg`, alto almeno 24 px;
   - splash o schermata di benvenuto: `svg/lockup/lockup-verticale-negativo.svg` o `-colore.svg`.
3. Se oggi il lettering "AREA MERCATALE / MAGLIE" è testo HTML accanto al logo, sostituisci il blocco logo + testo con il lockup SVG unico (i testi sono già in tracciati). Mantieni un `alt="Area Mercatale Maglie"` o un `aria-label` equivalente.
4. Favicon e PWA:
   - `<link rel="icon" href=".../favicon.svg" type="image/svg+xml">`, fallback `png/favicon-32.png`;
   - `<link rel="apple-touch-icon" href=".../apple-touch-icon-180.png">`;
   - nel manifest: `png/icona-192.png`, `png/icona-512.png` (purpose "any") e `png/icona-maskable-512.png` (purpose "maskable"); `theme_color` "#3d2b1a", `background_color` "#f5f0e8".
   - Se il service worker mette in cache le icone, aggiorna la versione della cache.
5. Rimuovi i riferimenti al vecchio `logo.svg` ma non cancellare il file: spostalo in una cartella `archivio/` o lasciamelo decidere.
6. Regole da rispettare: non ricolorare i singoli elementi, niente ombre, contorni o deformazioni; area di rispetto intorno al marchio pari almeno all'altezza del sole (circa il 35% dell'altezza del segno).
7. Non cambiare altro dell'interfaccia (colori, spaziature, testi) in questo passaggio.
8. Alla fine: avvia l'app in locale, controlla header, splash, favicon e installazione PWA su mobile, e dammi un riepilogo dei file modificati. Non fare commit o deploy senza chiedermelo.
