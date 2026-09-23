# Prompt per Claude Code - allineare app e sito al design system

Copia la cartella `design-system/` di questo pacchetto nel repository (per esempio in `brand/design-system/`), poi usa il testo qui sotto. Conviene farlo dopo il prompt del marchio.

---

In `brand/design-system/` c'è il design system "Mercati di Maglie" dell'Area Mercatale, costruito a partire dai valori già usati nel progetto (oggetti `S` e `T` in `app-src/src/App.jsx`, variabili `:root` di `index.html`). Contenuto:

- `BRAND.md` - regole d'uso: tono dei testi, colori, tipografia, forme e spazi, logo, mappa. Leggilo per primo.
- `tokens.css` - tutti i token come variabili CSS (`--terra`, `--ocra`, `--space-16`, `--radius-card`...) più le classi tipografiche e le regole `@font-face`.
- `tokens.json` - gli stessi token in formato dati (utile se l'app li usa da JavaScript).
- `fonts/` - Montserrat (300-900) e Playfair Display (400/700, anche corsivo) in woff2.
- `riferimento-componenti/` - lo stile di riferimento dei componenti (bottoni, badge posteggio, pill di stato, tag categoria, card espositore).

Obiettivo: fare in modo che app e sito usino un'unica fonte di verità per colori, font e misure, senza cambiare l'aspetto attuale se non dove è incoerente.

Cosa fare:

1. Analisi, senza modificare nulla: confronta i valori presenti nel codice (colori esadecimali, font, dimensioni, raggi, ombre) con i token. Dammi una tabella con: valore nel codice, dove si trova, token corrispondente, e i valori che non hanno un token o che differiscono di poco (es. due marroni quasi uguali). Aspetta la mia conferma.
2. Font: sostituisci il caricamento da Google Fonts con i file locali di `fonts/` tramite le regole `@font-face` di `tokens.css` (copia i woff2 nella cartella pubblica e aggiorna i percorsi). Mantieni `font-display: swap`.
3. Microsito (`index.html`): importa `tokens.css` e sostituisci le variabili `:root` esistenti con quelle dei token, rinominando gli usi dove serve.
4. Web app: importa `tokens.css` una volta all'avvio. Negli oggetti di stile `S` e `T` sostituisci i valori scritti a mano con `var(--nome-token)` (es. `background: 'var(--terra)'`, `borderRadius: 'var(--radius-card)'`). Se in alcuni punti serve il valore in JavaScript (canvas, mappa, calcoli), leggilo da `tokens.json`, senza ricopiare i numeri.
5. Colori della mappa: usa i token `mappa-*` e `rosso-assenza-mappa`; non modificare la geometria della planimetria.
6. Non introdurre nuovi colori, font o librerie UI. Se trovi un bisogno non coperto dai token, segnalamelo invece di inventare un valore.
7. Accessibilità: `terra-chiaro` e `ocra` come testo su fondi chiari hanno contrasto basso (vedi le note in `tokens.css`); segnalami i punti in cui sono usati per testo piccolo, senza cambiarli da solo.
8. Verifica visiva: prima e dopo, fai screenshot delle schermate principali (mappa, elenco espositori, scheda espositore, header) e confermami che non ci sono differenze inattese. Nessun commit o deploy senza il mio ok.
