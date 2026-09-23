# Mercati di Maglie — Piano v3 (modifiche strutturali)

Stato: bozza del 23/09/2026, dal briefing di Carlo dopo l'incontro col SUAP. Sostituisce le parti di `PIANO-V2.md` su ruoli, presenze e anagrafiche.

---

## 1. Principio: l'indice è l'espositore, non il posteggio

Oggi la relazione sta sul posteggio (`posteggi.{id}.espositoreId`). Diventa l'inverso: ogni espositore ha una lista di posteggi assegnati (un espositore può averne più di uno, oggi 9 casi). La collezione `posteggi` resta per geometria, settore, fila e numero, ma non contiene più l'assegnazione. `pubblico/{mercato}` viene ricostruito da `espositori` e resta l'unica lettura dell'app.

## 2. Modello dati Firestore

### `espositori/{id}` (pubblico in lettura, scrittura suap/admin)
| campo | note |
|---|---|
| `tipo` | `fisso` oppure `spuntista` |
| `denominazione` | ragione sociale, ditta individuale, società |
| `alias` | se compilato sostituisce la denominazione in tutto il frontend |
| `referente`, `email`, `whatsapp`, `telegram` | facoltativi; WhatsApp e Telegram mostrano i pulsanti nella scheda |
| `descrizione` | facoltativa, massimo 500 caratteri, mostrata in un collapse nella scheda |
| `visibile` | privacy: `false` = non compare nel frontend (il posteggio risulta occupato ma senza nome né contatti) |
| `mercati`, `settori`, `categoria` | come oggi |
| `posteggi` | array di id posteggio assegnati (solo fissi), es. `["A-30","A-31"]` |
| `scadenza` | data di fine concessione o di validità nell'elenco spuntisti (31/12 dell'anno); facoltativa per i fissi finché il SUAP non conferma |
| `attivo` | `false` = archiviato, non compare da nessuna parte |
| `foto` | invariato, funzione ancora nascosta |

Nel frontend NON si mostra più la superficie. Per gli spuntisti si mostrano solo denominazione (o alias) e presenza.

### `espositori_riservati/{id}` (solo suap/admin)
Invariato: CF, P.IVA, indirizzo, `qrToken`, più i campi dell'elenco spuntisti del SUAP che non vanno resi pubblici.

### `posteggi/{id}`
Geometria e classificazione; via `espositoreId` e `stato`. Lo stato (assegnato/vacante) si deriva da `espositori.posteggi`.

### `staff/{uid}`
`role` (`admin` | `suap` | `operatore`), `nome`, `cognome`, `email`, `telefono`, `attivo`. Ogni presenza registra chi l'ha certificata con uid, nome e cognome.

### `impostazioni/{mercato}` (scrittura admin/suap)
| campo | default area mercatale | uso |
|---|---|---|
| `registroPresenze` | `true` (coperto e ortofrutticolo: `false`) | se `false` niente presenze né presente/assente nel frontend |
| `oraLimiteSpunta` | `10:00` | dopo quest'ora il posteggio di un fisso assente è assegnabile a uno spuntista |
| `oraAzzeramento` | `13:00` | dopo quest'ora tutti risultano assenti (ripristino per la giornata successiva) |
| `assenzeMassime` | da definire | soglia annua di assenze non giustificate oltre la quale la concessione è revocabile |

### `calendario/{mercato}_{data}` (scrittura admin/suap)
| campo | note |
|---|---|
| `tipo` | `spostato` (mercato in altra data), `soppresso` (non si svolge), `straordinario` (giornata aggiuntiva) |
| `dataOriginale` / `dataNuova` | per gli spostamenti |
| `motivo` | testo libero: festivo, maltempo, forza maggiore |
| `avviso` | testo mostrato nell'app nella settimana interessata |

Regole di calcolo: le giornate di mercato dell'anno sono i sabati (giorno del mercato in `mercati`) più gli straordinari, meno i soppressi, con gli spostati portati alla data nuova. Le assenze si contano solo sulle giornate effettivamente svolte: una giornata soppressa non pesa su nessuno.

### `presenze/{data}_{mercato}_{espositoreId}` (record certificato, solo creazione da staff)
| campo | note |
|---|---|
| `data`, `mercato`, `ora` | giorno di mercato e orario della rilevazione |
| `espositoreId`, `tipoEspositore` | fisso o spuntista |
| `posteggioId` | posteggio occupato quel giorno (per lo spuntista quello assegnato dall'operatore) |
| `metodo` | `qr` oppure `elenco` |
| `operatore` | `{uid, nome, cognome}` di chi ha certificato |
| `posizione` | GPS del telefono dell'operatore, se disponibile |
| `ritardo` | `true` se registrata dopo l'ora limite di spunta |
| `annullata`, `annullataDa`, `motivoAnnullamento` | solo admin, la riga resta nello storico |

`stato/{mercato}` resta come vista del giorno per l'app (1 lettura), ricostruita ad ogni presenza.

### `richieste/{id}`
Invariato (proposte self-service dal link QR, approvazione suap).

## 3. Ruoli e permessi

| | admin | suap | operatore |
|---|---|---|---|
| anagrafiche espositori (fissi e spuntisti), posteggi, privacy | ✓ | ✓ | – |
| impostazioni, calendario | ✓ | ✓ | – |
| staff (creazione utenti, ruoli) | ✓ | – | – |
| report presenze e assenze, export Excel/PDF | ✓ | ✓ | – |
| presenze dall'app (QR o elenco), assegnazione spuntisti al posteggio | ✓ | ✓ | ✓ |
| annullare una presenza | ✓ | – | – |

Il pannello desktop è per admin e suap. L'app è per il pubblico e per l'operatore di controllo (Polizia Municipale), che non inserisce dati anagrafici.

## 4. Flussi

### Frontend pubblico (app e sito)
- Mappa dell'area mercatale, tocco sul posteggio, scheda con nome (alias se presente), settore, posteggio, descrizione a scomparsa, pulsanti WhatsApp/Telegram se forniti.
- "Portami lì" attivo solo se l'espositore è presente oggi; altrimenti nessun pulsante di navigazione.
- Elenchi del mercato coperto e dell'ortofrutticolo senza presente/assente.
- Elenco spuntisti dell'anno con la sola denominazione e, il giorno di mercato, presente/assente; quando presente compare sulla mappa nel posteggio assegnato.
- Avviso del calendario: "Questa settimana il mercato si svolge venerdì 25/09" oppure "Sabato 26/09 il mercato è soppresso (maltempo)".

### Operatore di controllo (app, solo da loggato)
- Scansione del QR del fisso oppure selezione dall'elenco → presenza certificata.
- Il QR inquadrato con la fotocamera del telefono apre l'app: senza login non registra nulla (mostra solo che il codice è valido e il link "Sei l'espositore? Proponi modifiche alla tua scheda"); con login chiede conferma.
- Spuntisti: seleziona lo spuntista dall'elenco e gli assegna un posteggio libero. Sono liberi i posteggi vacanti e, dopo l'ora limite di spunta, quelli dei fissi assenti.
- Se un fisso arriva dopo che il suo posteggio è stato dato a uno spuntista, la presenza viene comunque registrata con `ritardo: true`; sulla mappa resta lo spuntista. Il SUAP vede entrambi nel report.

### SUAP (pannello)
- Anagrafiche fissi e spuntisti (con scadenza), assegnazione e revoca di uno o più posteggi per espositore, privacy.
- Impostazioni del mercato e calendario.
- Report: filtro per periodo, espositore, posteggio, operatore; conteggio presenze, assenze e assenze giustificate; export Excel (xlsx) e PDF.

### Certificazione di fine giornata (fase successiva)
Chiusura del registro del giorno da parte dell'operatore con sigillo digitale (hash delle presenze del giorno firmato con l'utente e l'orario); dopo la chiusura nessuna modifica. Da valutare insieme in coda a tutto il resto.

## 5. Ordine dei lavori

1. Modello dati: espositori con `posteggi[]`, `tipo`, `visibile`, `scadenza`; staff con anagrafica; impostazioni e calendario; migrazione dei dati esistenti su Firestore; regole.
2. Pannello: scheda espositore ricentrata (più posteggi), spuntisti, impostazioni, calendario, staff con nome e cognome.
3. App: scheda senza superficie, descrizione a scomparsa, privacy, "Portami lì" solo se presente, coperto/ortofrutticolo senza presenze, elenco spuntisti, avviso calendario.
4. App operatore: QR solo da loggato, presenza da elenco, assegnazione spuntisti con regola dell'ora limite, azzeramento automatico.
5. Report nel pannello con export Excel e PDF.
6. Import dell'elenco spuntisti 2026 fornito dal SUAP.
7. Certificazione di fine giornata.

## 6. Da confermare con il SUAP

- Numero massimo di assenze annue per i fissi (valore iniziale in impostazioni).
- Scadenza della concessione dei fissi al 31/12 con rinnovo annuale: sì o no.
- Elenco spuntisti 2026 (formato e campi).
- Se gli spuntisti devono avere un QR come i fissi oppure solo la selezione dall'elenco (ipotesi: solo elenco).
