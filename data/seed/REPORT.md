# Report import elenchi SUAP

Fonte: Elenchi SUAP Comune di Maglie del 07/09/2026. Generato da `scripts/import-suap.py`.

## Conteggi

| Elenco | Posteggi | Assegnati | Vacanti |
|---|---|---|---|
| Area Mercatale — settore A (Abbigliamento / biancheria) | 168 | 87 | 81 |
| Area Mercatale — settore B (Abbigliamento usato) | 10 | 9 | 1 |
| Area Mercatale — settore C (Alimentare) | 12 | 10 | 2 |
| Area Mercatale — settore D (Calzature) | 45 | 38 | 7 |
| Area Mercatale — settore E (Casalinghi / ferramenta / fiori) | 22 | 11 | 11 |
| **Area Mercatale — totale** | 257 | 155 | 102 |
| Coperto — box | 8 | 5 | 3 |
| Coperto — panche | 10 | 7 | 3 |
| Ortofrutticolo — box | 7 | 2 | 5 |
| Ortofrutticolo — settimanale | 19 | 15 | 4 |
| **Totale** | 301 | 184 | 117 |

Espositori distinti: **175** (dedup per C.F. / P.IVA / nome).

- area-mercatale: 149
- coperto: 12
- ortofrutticolo: 14

## Espositori con più posteggi

- de-matteis-claudio: 2 posteggi (A-96, A-27)
- perrotta-gianpiero-davide: 2 posteggi (A-1, A-2)
- forlano-giuseppe: 2 posteggi (A-51, A-52)
- paglialonga-walter: 2 posteggi (A-144, A-145)
- vitale-lucio-james: 2 posteggi (D-3, D-4)
- fuso-alessandro-antonio: 2 posteggi (D-29, D-30)
- rizzo-giuseppe: 2 posteggi (IMM-3, IMM-4)
- notaro-marco: 2 posteggi (IMM-6, IMM-30)
- calo-francesco: 2 posteggi (IMM-24, IMM-25)

## Anomalie da verificare

- Immacolata BOX riga 7: nessun box/banco indicato (stato vacante)
- Settore A riga 135: C.F. non valido 'NTNGU95S07D862L' (ANTONACI Luigi)
- Settore D riga 41: P.IVA non valida '049434440752' (12 cifre) (NOCERA Giancarlo / NOCERA GIAN CARLO)
- Coperto BOX riga 2: P.IVA non valida '0144280757' (10 cifre) (FERSINI Luigi / ADRIATICA SOCIETA' COOPERATIVA)

## Da fare (Fase 0.3)

- `mapId` è `null` per tutti i posteggi dell'area mercatale: manca la riconciliazione con P001–P251 della mappa v1 (serve il DWG o la mappatura manuale).
- Mancano gli elenchi dei settori 'opere del proprio ingegno', 'prodotti vari' e 'vendita uova' presenti in legenda.
- Giorni/orari/indirizzi ufficiali dei 3 mercati (vedi mercati.json).
