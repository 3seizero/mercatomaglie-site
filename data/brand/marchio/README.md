# Area Mercatale Maglie - marchio (proposta P2 "Tenda")

Il banco del mercato: il sole che sorge dietro una tenda a tre festoni, sorretta da due paletti.
Forme piene, un solo spessore. Testi del lockup in Montserrat (ExtraBold / Medium) già convertiti in tracciati: nessun font da caricare.

## Colori

| Ruolo | Hex | Dove |
|---|---|---|
| terra | `#3d2b1a` | festoni laterali, paletti, "AREA MERCATALE"; fondo di icone e header scuri |
| ocra | `#c8862a` | festone centrale, "MAGLIE" su fondo chiaro |
| ocra chiaro | `#e8a045` | sole; su fondo terra anche festone centrale e "MAGLIE" |
| sabbia | `#f5f0e8` | festoni e "AREA MERCATALE" nella versione negativa |

## File

- `svg/marchio/` - solo il segno: `colore` (fondi chiari), `negativo-su-terra` (fondi scuri), `mono-terra`, `bianco`, `nero`.
- `svg/lockup/` - segno + "AREA MERCATALE / MAGLIE": `orizzontale-*` per header e testate, `verticale-*` per schermate di benvenuto, social e usi quadrati. Varianti `colore`, `mono`, `negativo`, `bianco`, `nero`.
- `svg/icone/` - `icona-app.svg` (angoli arrotondati), `icona-app-quadrata.svg` (per iOS, che arrotonda da sé), `icona-maskable.svg` (PWA, segno dentro l'area sicura), `favicon.svg`, `icona-app-chiara.svg`.
- `png/` - pronti all'uso: `favicon-32`, `favicon-48`, `apple-touch-icon-180`, `icona-192`, `icona-512`, `icona-maskable-512`, lockup orizzontali e marchio a colori.

## Indicazioni per web app e sito

- Header scuro (fondo terra): `lockup-orizzontale-negativo.svg`, altezza consigliata 36-44 px.
- Fondi chiari (sabbia o bianco): `lockup-orizzontale-colore.svg`.
- Spazi stretti (sotto i 240 px di larghezza): solo il segno, `marchio-colore.svg` o `marchio-negativo-su-terra.svg`, alto almeno 24 px.
- Area di rispetto: lascia intorno al marchio almeno l'altezza del sole.
- Non ricolorare i singoli elementi, non aggiungere ombre o contorni, non deformare.
- Favicon e PWA, esempio:
  ```html
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon-32.png" sizes="32x32">
  <link rel="apple-touch-icon" href="/apple-touch-icon-180.png">
  ```
  nel manifest: `icona-192.png`, `icona-512.png` e `icona-maskable-512.png` con `"purpose": "maskable"`; `theme_color` `#3d2b1a`, `background_color` `#f5f0e8`.
