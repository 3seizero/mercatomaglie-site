# Prompt per Claude Design — due pannelli 70×100 cm per l'Area Mercatale di Maglie

Allegare al prompt: `data/mappa/area-mercatale-v2.svg` (piantina vettoriale), `docs/pannelli/elenco-espositori-per-categoria.md` (elenco), il logo dell'app (`app/logo.svg`) e, quando disponibili, i loghi istituzionali.

---

Devi progettare **due pannelli da stampa in formato verticale 70 × 100 cm** (più 5 mm di abbondanza per lato, segni di taglio, risoluzione 300 dpi o vettoriale, colori in CMYK) per l'**Area Mercatale di Maglie (Lecce)**, il mercato settimanale del sabato. I pannelli saranno affissi all'ingresso del mercato e letti da persone in piedi a 1–2 metri di distanza: la leggibilità viene prima di tutto. Titoli non sotto i 90 pt, testo corrente non sotto i 26 pt, contrasto alto.

## Identità grafica da rispettare

Riprendi esattamente l'identità della web app e del sito, che ti allego:

- Palette: terra `#3d2b1a` (fondi scuri e testi principali), ocra `#c8862a` e ocra chiaro `#e8a045` (accenti, titoli in corsivo, linee), sabbia `#f5f0e8` e sabbia scura `#e8dfc8` (fondi chiari e riquadri), bianco. Verde presenza `#3daa70` solo per piccoli elementi di legenda.
- Font: **Montserrat** (Google Fonts) per tutto, con i pesi 300/400 per i testi, 700/800 per titoli ed etichette in maiuscoletto spaziato (letter-spacing 3–5 pt), come nel sito. È ammesso un serif elegante (Playfair Display) solo per i titoli con parola in corsivo, nello stile "Il mercato *più amato* del Salento".
- Stile: pulito, caldo, con molto spazio bianco, angoli arrotondati (raggio ~14 px in scala app), nessun gradiente vistoso, nessuna foto stock. Riquadri chiari su fondo sabbia oppure fondo terra con testi chiari: scegli un solo impianto per entrambi i pannelli, così che siano gemelli.

## Intestazione, uguale sui due pannelli

- **In alto a sinistra**: il logo dell'app (portale del mercato con tende e sole, file allegato) con accanto il lettering "AREA MERCATALE" e sotto "MAGLIE" in maiuscoletto spaziato, come nell'header dell'app.
- **In alto a destra**: una fascia con i **loghi istituzionali** (per ora tre segnaposto rettangolari grigio chiaro con la scritta "LOGO", larghezza ~9 cm ciascuno, allineati a destra) e, sotto di essi, la **dicitura del finanziamento pubblico** in due righe da 22–24 pt: per ora usa il testo segnaposto "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore" (verrà sostituito).
- Sotto l'intestazione una linea sottile ocra a tutta larghezza.

## Piè di pagina, uguale sui due pannelli

Fascia bassa alta ~9 cm: a sinistra un **QR code** (segnaposto, verrà generato) di 6 × 6 cm con la didascalia "Inquadra per aprire la mappa live sul telefono"; al centro l'indirizzo web in evidenza `3seizero.com/projects/maglie/areamercatale/app` (in futuro cambierà in mercatomaglie.it: lascia lo spazio); a destra la riga "Ogni sabato · 6:00 – 13:00 · Area Mercatale, Maglie". Sotto, in piccolo, "Comune di Maglie · Sportello Unico Attività Produttive" e "Aggiornato al 07/09/2026".

## Pannello 1 — "Gli espositori"

Titolo: "Gli **espositori**" (con la seconda parola in ocra corsivo). Sottotitolo 30 pt: "257 posteggi in 5 settori merceologici. Cerca il tuo espositore e raggiungilo con il codice del posteggio."

Contenuto: l'elenco allegato, organizzato **per settore** in questo ordine e con questi colori di riferimento (ripresi dalla piantina ufficiale del Comune, da usare solo come piccolo quadrato colorato accanto al titolo del settore, non come fondo):

1. Settore A · Abbigliamento e biancheria · magenta `#e040e0` · 87 espositori
2. Settore D · Calzature · blu `#3b3bff` · 38 espositori
3. Settore E · Casalinghi, ferramenta e fiori · verde `#22cc22` · 11 espositori
4. Settore C · Alimentari · arancio `#ff9a4a` · 10 espositori
5. Settore B · Abbigliamento usato · azzurro `#66aaff` · 9 espositori

Dentro ogni settore le voci sono **ordinate per numero di posteggio**, come nel file. Ogni voce mostra: il **codice posteggio** in grassetto e in un riquadro chiaro (es. `A 30`), poi il nome pubblico dell'espositore. Non riportare la fila né dati personali. I 155 nomi devono entrare tutti in modo leggibile: usa una griglia a 3 colonne per il settore A (che ha 87 voci) e a 2 colonne per gli altri, con separatori discreti; testo delle voci 26–28 pt, codici 30 pt. Se lo spazio non basta, riduci gli spazi bianchi, non il corpo del testo.

Un box in evidenza in fondo alla colonna di destra: "Non trovi qualcuno? L'elenco aggiornato e le presenze di oggi sono nell'app: inquadra il QR."

## Pannello 2 — "La piantina"

Titolo: "La **piantina** del mercato". Sottotitolo: "Ogni posteggio ha un codice: lettera del settore e numero. Lo trovi anche nell'app, che ti porta a piedi fino al banco."

Contenuto: la **planimetria allegata in SVG** (già orientata con il nord in alto, strade in grigio, area mercato in bianco, parcheggi in giallo, aiuole in verde, piazza eventi in terracotta) portata a occupare almeno il 75% dell'altezza utile. Mantieni la geometria esattamente com'è (è georeferenziata), puoi ricolorare i livelli per aderire alla palette: strade terra scuro, area mercato sabbia chiaro, parcheggi sabbia scura, aiuole verde spento `#9ec583`, piazza eventi ocra chiaro. Colora i **posteggi per settore** con i cinque colori indicati sopra, in versione pastello (opacità 55%) e con bordo sottile, e stampa dentro ogni posteggio il **numero** in Montserrat 700, nero, leggibile a 1,5 m (almeno 14 pt in scala di stampa; per i posteggi più piccoli ruota il numero lungo il lato lungo). I posteggi non numerati nell'elenco (A-47, i tre "prodotti vari" dietro la tensostruttura, il cerchio "uova") restano in grigio chiaro senza colore di settore.

Aggiungi:

- una **legenda** in un riquadro in basso a sinistra: i cinque settori con quadrato colorato e nome, più "Parcheggio", "Aiuole", "Piazza eventi", "Ingresso";
- una **rosa dei venti** minimale con il nord in alto;
- le **etichette delle file** (numeri cerchiati 1–27, 33–34) lungo i bordi, se lo spazio lo consente, in ocra;
- un marcatore "Sei qui" (pin ocra) in corrispondenza dell'ingresso principale a nord-ovest, dove sarà affisso il pannello; lascia il pin come oggetto spostabile perché la posizione esatta verrà confermata.

## Consegna

Due file separati, stesso impianto, pronti per la stampa (PDF vettoriale con abbondanza e crocini; in più un PNG di anteprima a 150 dpi). Testi editabili, livelli nominati (Intestazione, Contenuto, Legenda, Piè di pagina). Non inventare nomi di espositori o loghi: usa solo i dati allegati e i segnaposto indicati.
