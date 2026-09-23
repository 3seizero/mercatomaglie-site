# Planimetria v2 — ricostruzione dal CAD del Comune (Fase 0.3)

Data: 22/09/2026. Stato: **da revisionare** (Carlo, in Illustrator) prima dell'integrazione nell'app.

## File prodotti

| File | Contenuto |
|---|---|
| `data/mappa/area-mercatale-v2.svg` | Planimetria nello stile v1: livelli `Area_Mappa`, `Strada_di_accesso`, `Area_Mercato`, `Aree_Parcheggio`, `Aiuole`, `Area_Bar__x2F__Eventi`, più `Postazioni/Settore_A…E` (un `<polygon id="A-86">` per posteggio) ed `Etichette`. |
| `data/mappa/area-mercatale-v2-anteprima.png` | Render della SVG. |
| `data/mappa/verifica-satellite.png` | Posteggi CAD sovrapposti alla foto satellitare (Esri, zoom 19) con i 4 punti GPS rilevati nella v1. |
| `data/seed/posteggi-mappa.json` | 257 posteggi con vertici in unità mappa, centro, **lat/lon**, settore, numero, flag `inElenco`. |
| `data/seed/posteggi.json` | aggiornato: `mapId` = codice ufficiale per tutti i 257 posteggi. |
| `scripts/mappa/` | pipeline di estrazione (vedi README lì dentro). |

## Come è stata costruita

1. **Geometria dai vettori del PDF.** `pdftocairo -svg` sulla piantina: ogni posteggio è un tracciato chiuso con colore di settore (magenta A, blu D, verde E, azzurro B, arancio C). 256 poligoni trovati; E-3 aveva il contorno aperto (3 lati) ed è stato chiuso a mano; i poligoni a 5–6 vertici (che proseguono nel posteggio adiacente) sono stati ridotti al rettangolo corretto. Scala del CAD: 3 pt = 1 m (verificata sulle superfici: 9x5 → 27x15 pt).
2. **Numeri letti a vista.** I numeri sono glifi convertiti in tracciati, non testo. Ho generato fogli di ritagli a 600 dpi ruotati e li ho trascritti; ogni lettura è stata controllata con gli elenchi SUAP (numero + superficie + settore). Tutti i 257 codici degli elenchi tornano, tranne le eccezioni sotto.
3. **Georeferenziazione.** Il CAD non è orientato a nord (la ferrovia è il bordo inferiore del foglio). L'orientamento è stato trovato per correlazione tra la maschera delle aiuole del CAD e gli alberi della foto satellitare: picco netto a **225,5° orari** (correlazione 0,26 contro 0,15 altrove). Il risultato coincide con il tracciato a terra visibile dal satellite (file, aiuole centrali, blocchi laterali) e con i 4 punti GPS della v1, che cadono agli angoli attesi.
4. **Coordinate mappa.** I punti sono passati CAD → lat/lon → unità mappa v1 usando la stessa calibrazione `GEO` dell'app (P1 NW 40.116944, 18.309139 → 630,460; 5,103 unità/m; nord in alto). Quindi **la calibrazione GPS dell'app non cambia**: cambia solo la geometria.
5. **Livelli di base.** Strade e aiuole vettorializzate dal raster del CAD (celle da 0,24 m, tolleranza 0,5 m); area mercato e fascia parcheggi per riempimento delimitato dalle strade; contorno esterno come dilatazione di 22 m. La piazza bar/eventi è presa dal satellite (la tensostruttura), non dal CAD.

## Cosa è cambiato rispetto alla mappa v1

- La base v1 aveva il perimetro ruotato di circa 30° rispetto alla realtà (solo i blocchi di posteggi erano approssimativamente giusti). La v2 è metrica e orientata a nord.
- 257 posteggi con i codici ufficiali (settore-numero, es. `A-86`) al posto di P001–P251. La fila non è nella geometria ma è in `posteggi.json`.
- Il lotto delle file 23–27 (posteggi 131–166) sta nell'area a nord-ovest, fuori dal recinto principale, come nel CAD.

## Revisione del 22/09/2026 (Carlo)

- Tavola allargata a `viewBox 0 0 2055.6 1842.6`: Illustrator ha traslato tutto il contenuto di **+287.93 in y** (x invariata, scala invariata). Per l'app la calibrazione diventa `p1SvgY = 747.93` (era 460); tutto il resto di `GEO` resta uguale. `posteggi-mappa.json` è già nel nuovo sistema.
- Piazza bar/eventi ridotta a mano da Carlo.
- Aggiunti i 3 posteggi con contorno nero dietro la tensostruttura (`PV-1`, `PV-2` 6x5 in etichetta ma disegnati 4,5x3,8; `PV-3` "10x10" ma disegnato 6,7x6,7) e il posteggio temporaneo vendita uova (`UOVA-1`, cerchio). In legenda il nero è "attività espositiva prodotti vari": non esiste elenco SUAP per questi, quindi `inElenco=false`.
- Ipotesi di Carlo: A-47 probabilmente vacante. Il 119 è stato poi trovato in piantina (vedi sopra).

## Risposte del SUAP (23/09/2026)

- A-47: posteggio vacante, aggiunto agli elenchi dell'app.
- Superfici: fanno fede gli elenchi 2026 (la piantina resta come geometria).
- PV-1, PV-2, PV-3 e UOVA-1: categoria "Altre attività", nessun espositore fisso, assegnati di volta in volta.
- Dati anagrafici errati: correzioni in arrivo dal SUAP.
- Orari ufficiali: Area Mercatale sabato 7-13; Mercato Coperto lunedì-sabato 7-13; Ortofrutticolo sabato 7-13.

## Anomalie da segnalare al Comune

- **A-47** (fila 8, 5x5) è disegnato in piantina ma non compare negli elenchi SUAP.
- ~~A-119~~: c'è, accanto al 118bis, come poligono irregolare ("mq 42") che il filtro dei quadrilateri aveva scartato; aggiunto il 22/09/2026. Non è un'anomalia.
- Superfici diverse tra piantina (2017) ed elenco (2026), dedotte sia dall'etichetta stampata nel disegno (es. "8x4" su 142) sia dalle dimensioni vettoriali del poligono (3 pt = 1 m), che concordano tra loro: A-52 (8x5 vs 9x5), A-63 (6x5 vs 7x5), A-139/163/140/164 (larghezza 5 vs 4), A-142 (8x4 vs 5x6), C-8 (8x5 vs 8x3), C-9 (8x5 vs 9x5). I posteggi di fine fila (131, 135, 136, 138, B-4, E-9, E-22) sono trapezi: il lato lungo in piantina è maggiore di quello in elenco, non è un errore.

## Precisione e verifica in loco

L'errore atteso è 1–3 m, limitato dalla georeferenziazione delle immagini satellitari, non dal CAD. La verifica sul campo prevista in Fase 2 (l'operatore registra la posizione GPS quando scansiona il QR) misurerà lo scostamento per ogni posteggio; se sistematico (traslazione/rotazione), si corregge la calibrazione una volta sola.

## Prossimo passo (dopo la revisione di Carlo)

Integrazione in `App.jsx`: sostituire `PLANIMETRIA_URI` e `ESPOSITORI_INIT` con la nuova SVG e `posteggi-mappa.json`, cambiare gli id da P001 a codici ufficiali, incrementare `DATA_VERSION`, verificare desktop + mobile.
