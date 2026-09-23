# Design system nel codice — note di allineamento (23/09/2026)

Fonte di verità: `data/brand/design-system/` (tokens.css, tokens.json, font). Copie usate dal codice:
`app-src/src/brand/`, `admin-src/src/brand/`, `brand/` (microsito). Se il pacchetto cambia, ricopiare le tre cartelle.

## Come è cablato
- **App**: `main.jsx` importa `brand/tokens.css` (variabili + `@font-face` locali, niente più Google Fonts).
  I colori in JavaScript vengono da `brand/tokens.js` (`C.terra`, `C.ocra`, `C.mappaStrade`…), generato da tokens.json;
  la palette storica `T` di `App.jsx` ora punta ai token. Gli attributi SVG della mappa usano `C.mappa*`.
- **Pannello**: `main.jsx` importa `brand/tokens.css`; `styles.css` mantiene i nomi storici (`--sand`, `--textL`…) come alias dei token.
- **Microsito**: `index.html` carica `brand/tokens.css`; le variabili storiche di `:root` sono alias dei token.
  Il serif dei titoli è passato da Cormorant Garamond a **Playfair Display**, come da BRAND.md (unica differenza visiva voluta).

## Valori senza token (estensioni locali, da valutare per il pacchetto)
| Valore | Uso | Scelta |
|---|---|---|
| `#e0a800` / `#a07000` | esito "occasionale" (scheda QR) | costanti `gialloOccasionale`, `gialloOccasionaleTesto` in tokens.js |
| `#2e7d52` | testo dei messaggi di conferma | `verdePresenzaTesto` |
| `#1a5a8a #1e7a50 #5a3e8a #a02030 #b87320` | colori delle categorie eventi (`EV_COL`) | lasciati: palette funzionale degli eventi |
| trasparenze di terra/ocra/bianco (`rgba(61,43,26,.95)`, `rgba(200,134,42,.15)`…) | overlay, ombre, focus ring | lasciate: derivano dai token |
| `#f0ece4`, `#9a8878`, `#786050`, `#c8b8a0`, `#c0b0a0`, `#d8d0c4` | ex grigi-terra intermedi | mappati su `sabbia`, `terra-chiaro`, `bordo`, `mappa-postazione-libera-bordo` |

## Contrasto: punti da rivedere (non modificati)
- `terra-chiaro` come testo 10–11 px: sottotitoli delle card espositore, righe "etichetta · referente" nelle liste di Gestione, didascalie del popup, testo del piè di pagina del login.
- `ocra` su `ocra-tint`: tag categoria nelle liste (bold maiuscolo 9–10 px).
- `ocra-chiaro` come titolo di pagina nell'header (10 px corsivo su `terra`: 6.1:1, ok).
