# Pipeline planimetria v2 (Fase 0.3)

Script usati per ricostruire `data/mappa/area-mercatale-v2.svg` dal PDF del Comune.
Richiedono un venv con `numpy pillow opencv-python-headless` e `pdftocairo`/`pdftoppm` (poppler).
Lavorano in una cartella di scratch che deve contenere:

1. `piantina.svg` ← `pdftocairo -svg "Piantina area mercatale.pdf" piantina.svg`
2. `p600-1.png`   ← `pdftoppm -r 600 -png "Piantina area mercatale.pdf" p600`
3. `analyze.py`   → estrae i tracciati; `sheets.py` → poligoni dei posteggi (`quads.json`) e fogli di ritagli per la lettura a vista dei numeri
4. `read-*.txt`   ← trascrizione manuale (indice → numero superficie), già fatta e verificata con gli elenchi SUAP
5. georeferenziazione: tessere satellitari Esri z19 attorno a 40.1162,18.3104 (`sat19.png`, `sat19.json`) e correlazione aiuole/alberi → `cad2gps.json` (rotazione 225.5°, traslazione)
6. `assemble.py`  → SVG stile v1 + `map-v2.json` (posteggi con lat/lon)

Vedi `docs/MAPPA-V2.md` per metodo, risultati e anomalie.
