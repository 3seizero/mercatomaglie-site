Identità della web app e del microsito dell'Area Mercatale di Maglie, il mercato settimanale del sabato. Calda, terrosa, istituzionale ma vicina: toni della terra salentina, un solo accento ocra, Montserrat ovunque.

## Tono dei contenuti

- Italiano, istituzionale ma caldo, frasi brevi.
- Seconda persona singolare: "Trova subito quello che ti serve", "Portami al banco", "Inquadra per aprire la mappa live sul telefono".
- Etichette in maiuscoletto spaziato (`label`): "SETTORE A", "PRESENTI OGGI". Il resto in minuscolo con iniziale maiuscola.
- Codici posteggio sempre come lettera + spazio + numero: "A 30", "D 13/14", "A 118bis".
- Usa il trattino normale (-) negli intervalli: "6:00 - 13:00". Niente emoji.

## Colore

- Fondo pagina `sabbia`; card `bianco` con bordo `bordo` e `shadow-card`; riquadri secondari `sabbia-scura`.
- Superfici scure (header, nav, bottone primario) in `terra`, con testo `bianco` e accenti `ocra-chiaro`.
- Testo principale `terra-testo`, secondario `terra-medio`. `terra-chiaro` solo per didascalie ed etichette brevi (contrasto 3.2-3.7:1).
- `ocra` è l'unico accento: CTA, linee, badge, tag. Non introdurre altri colori di marca.
- Colori di stato solo per stati: `verde-presenza` = presente, `rosso-assenza` = assente/errore, `blu-navigazione` = "A piedi" e posizione utente. Accompagna sempre il colore con una parola ("Presente", "Assente").
- `verde-whatsapp` e `azzurro-telegram` solo sui rispettivi pulsanti di contatto.
- I token `mappa-*` servono solo per la planimetria.

## Tipografia

- Una sola famiglia: Montserrat. Pesi 300/400 per testi lunghi, 500/600 per UI, 700/800 per titoli, etichette e numeri.
- Playfair Display solo nei titoli editoriali, e solo per la parola chiave in corsivo: "Il mercato *più amato* del Salento" (`editorial-title` + `editorial-accent`). Su `terra` la parola va in `ocra-chiaro`; su fondo chiaro in `ocra`, solo a corpo grande.
- Scala app: `page-title` 16-20, `card-name` 15-16, `body` 12-13, `caption` 10-11, `label` 9-10.
- Stampa: moltiplica la scala app per 2,5-3. Sui pannelli 70×100 cm: titoli almeno 90 pt, testo mai sotto 26 pt (`print-*`).

## Forme e spazi

- Base 4 px (`space-4`). Padding card `space-14`-`space-16`, gap liste `space-8`-`space-10`.
- Raggi: `radius-card` 14 px, `radius-button` 10 px, `radius-sheet` 20 px, `radius-round` per i pallini.
- Bordi `border-thin` in `bordo`; `border-strong` per il badge posteggio.
- Bottoni alti 40-48 px, peso 700, angoli `radius-button`: primario `terra` + testo bianco, CTA `ocra` + testo bianco, neutro `sabbia-scura` + testo `terra`.
- Niente gradienti vistosi, niente foto stock: molto spazio bianco, riquadri chiari.

## Logo

- Marchio attuale (proposta P2 "Tenda", in adozione): il banco del mercato, sole che sorge dietro una tenda a tre festoni. File in `assets/Marchio/`. Forme piene, un solo spessore; il vecchio logo a tratto in `assets/Logo/` resta come archivio.
- Su fondo chiaro: `marchio/marchio-colore.svg` o `lockup/lockup-orizzontale-colore.svg` (festoni `terra` e `ocra`, sole `ocra-chiaro`, "MAGLIE" `ocra`).
- Su fondo `terra` (header dell'app): `lockup/lockup-orizzontale-negativo.svg` (festoni `sabbia`, centrale e sole `ocra-chiaro`).
- A un colore: `mono` (terra), `bianco`, `nero`. Icona app e favicon in `icone/`.
- Lockup: "AREA MERCATALE" Montserrat 800 spaziato, sotto "MAGLIE" Montserrat 500 molto spaziato. Componente `Lockup`.
- Sotto i 240 px di larghezza usa solo il segno, alto almeno 24 px. Area di rispetto: l'altezza del sole. Non ricolorare i singoli elementi, niente ombre o contorni.

## Mappa

- `assets/Map/area-mercatale-v2.svg` è la planimetria georeferenziata, con il nord in alto: non modificarne la geometria. Ogni posteggio è un poligono con id `<settore>-<numero>` e attributi `data-settore` / `data-numero`.
