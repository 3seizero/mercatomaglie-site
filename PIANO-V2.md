# Mercati di Maglie — Piano v2

Stato: bozza del 15/09/2026, da discutere. Fonti: cartella `../Library/` (piantina ufficio tecnico + elenchi SUAP del 07/09/2026) e app v1 (commit `ad19d00`).

---

## 1. Inventario e categorizzazione del materiale ricevuto

### 1.1 Piantina area mercatale (`Piantina area mercatale.pdf`)
- Tavola A3 "Nuova Area Mercatale — Individuazione postazioni e settori merceologici", Comune di Maglie, datata 02/01/2017.
- Vettoriale ma con testi convertiti in tracciati: i numeri dei posteggi NON sono estraibili come testo (verificato con pdftotext). Servirebbe il DWG/DXF originale o una lettura manuale/OCR.
- Legenda settori (colori): Abbigliamento, Casalinghi, Alimentari, Abiti usati, Calzature, Opere del proprio ingegno, Attività espositiva prodotti vari, passaggio pedonale di sicurezza, posteggi vacanti, posteggio temporaneo vendita uova.
- Numerazione: per settore + fila (es. settore A, fila 6, posteggio 30). Diversa dalla numerazione sequenziale P001–P251 dell'app v1.

### 1.2 Area Mercatale — elenchi posteggi SUAP (5 allegati, tutti datati 07/09/2026)
Colonne: n. ordine, cognome e nome, denominazione impresa, C.F., P.IVA, fila, posteggio scelto, superficie (m).

| Settore | Merceologia | Posteggi | Assegnati | Vacanti | File | Note |
|---|---|---|---|---|---|---|
| A (All. 1) | Abbigliamento / biancheria | 168 | 87 | 81 | 1–14, 23–27, 25bis–27bis, 33–34 | posteggi "bis", "55/56"; 5 imprese con 2 posteggi |
| B (All. 2) | Abbigliamento usato | 10 | 9 | 1 | 15, 17–20 | |
| C (All. 3) | Alimentare | 12 | 10 | 2 | 19–22 | |
| D (All. 4) | Calzature | 45 | 38 | 7 | 1–8, "VERT" | posteggi "13/14", "27/28"; 2 imprese con 2 posteggi |
| E (All. 5) | Casalinghi / ferramenta / fiori | 22 | 11 | 11 | 13–18 | |
| **Totale** | | **257** | **155** | **102** | | circa 150 imprese distinte |

Osservazioni:
- L'app v1 ha 251 postazioni; gli elenchi ne contano 257. Vanno riconciliate geometria e codici (vedi §3.1).
- Mancano gli elenchi dei settori presenti in legenda ma senza allegato: "opere del proprio ingegno", "prodotti vari", "vendita uova". Da chiedere al SUAP.
- Superfici presenti solo per l'area mercatale: utili per mostrare la dimensione del banco.
- Refusi nei dati sorgente (es. una P.IVA a 12 cifre nel settore D): l'import va validato.

### 1.3 Mercato Coperto "Centro" (Piazza Mercato)
- **Box** (`ELENCO BOX Mercato Centro.pdf`): 8 box da 4x3 m, numerati 14–21. 4 assegnati (prodotti ittici), box 17 "operatori vari – vendita settimanale carni", 3 vacanti (18, 19, 20). Colonne come sopra + "articolo di vendita".
- **Panche** (`ELENCO CONCESSIONI - Panche Mercato Centro.pdf`): 10 posti "prodotti agricoli", 7 assegnati a produttori (solo nome e indirizzo, niente P.IVA), 3 vacanti (4, 7, 9).

### 1.4 Mercato Ortofrutticolo (Piazza Immacolata) — "mercato settimanale del sabato"
- **Box** (`Elenco BOX mercato P.zza Immacolata.pdf`): 5 box + box deposito n. 6 + 2 banchi vendita. 2 assegnati (entrambi Sticchi, di cui un'azienda agricola), 4 vacanti.
- **Settimanale** (`Elenco mercato settimanale ortofrutticolo...pdf`): 19 posteggi (numeri 1–30 non continui), 15 assegnati a 13 operatori distinti (3 con doppio posteggio), 4 vacanti di cui 2 riservati agli agricoltori. Merceologia: frutta e verdura, ortofrutta, fiori (1).

### 1.5 Dati personali presenti
Gli elenchi contengono codice fiscale, P.IVA e indirizzi di residenza. Questi dati NON vanno mai nell'app pubblica: restano in una collezione riservata leggibile solo da admin. Nel pubblico vanno solo denominazione, alias, referente, categoria, posteggio e contatti forniti con consenso.

### 1.6 Incongruenze da chiarire con il Comune
- L'offerta approvata (prot. 13328 del 15/05/2026) cita il "mercato ortofrutticolo di Via Toma Nuzzichi attivo nei giorni feriali"; gli elenchi parlano di Piazza Immacolata "mercato del sabato" e di Piazza Mercato "Centro". Servono per ciascun mercato: indirizzo, giorni e orari ufficiali.
- La piantina è del 2017: verificare che file 23–27, 25bis–27bis, 33–34 esistano nella tavola consegnata (nell'app v1 alcune zone potrebbero mancare).

---

## 2. Cosa cambia rispetto alla v1

| Area | v1 (oggi) | v2 (obiettivo) |
|---|---|---|
| Mercati | 1 mappa + 2 elenchi demo inventati | 3 mercati con dati reali SUAP; mappa solo per l'area mercatale |
| Espositori | 50 demo su 251, campi nome/titolare/categoria/whatsapp/targa | ~150 imprese reali; denominazione, alias, referente, WhatsApp, Telegram, settore, posteggio (settore/fila/n.), superficie, descrizione, foto, tipo (concessionario/occasionale) |
| Presenza | toggle manuale in admin, salvato in localStorage per sempre | presenza giornaliera registrata dall'operatore via scansione QR; scade automaticamente a fine giornata |
| Accesso backend | password unica "admin2024" hardcoded | login con ruoli: Admin (tutto), Operatore (scansione + presenze), opzionale SUAP (anagrafiche) |
| Targhe | simulatore targa + campo targa | rimosso dall'app; archiviato in git (tag `v1-targhe`) e documentato in `docs/ARCHIVIO-targhe.md` |
| Persistenza | localStorage del singolo telefono | database condiviso (Firebase Firestore) |
| Navigazione | Google Maps `dir/?api=1&destination=` | aggiungere `&travelmode=walking`; fallback Apple Maps `dirflg=w` |
| Microsito | "Area Mercatale Maglie", 1 mercato | "Mercati di Maglie", 3 mercati, sezione espositori/SUAP/QR |

---

## 3. Piano di azione

### Fase 0 — Preparazione (≈ 1 settimana)
1. **Tag `v1-targhe`** sul commit attuale e documento `docs/ARCHIVIO-targhe.md` con descrizione della funzione (simulatore, campo targa, idea sbarra OCR) per riattivarla in futuro. Poi rimozione di ogni riferimento a targhe in App.jsx (campo dati, tab "Accessi", stili) e nel CLAUDE.md.
2. **Import dati reali**: estrazione dei 9 PDF in un file `data/seed/*.json` (già fattibile: i PDF degli elenchi hanno testo estraibile). Validazione P.IVA/CF, normalizzazione nomi, gestione doppi posteggi.
3. **Riconciliazione mappa ↔ codici ufficiali** (il punto più delicato). Opzioni:
   - **A (consigliata)**: chiedere all'ufficio tecnico il DWG/DXF della piantina con il layer dei numeri; da lì la mappatura è automatica.
   - **B**: modalità "mappatura" nel backend admin: si tocca una postazione sulla mappa e si digita settore+numero (≈ 257 tocchi, 1–2 ore di lavoro, una volta sola).
   - **C**: lettura visiva della piantina renderizzata ad alta risoluzione, cella per cella (fattibile da Claude ma con rischio di errori da verificare a campione).
   Le postazioni mancanti nella v1 (257 vs 251) vanno aggiunte al vettoriale.

### Fase 1 — Backend condiviso e ruoli (≈ 2 settimane)
Stack consigliato: **Firebase** (Auth + Firestore + Storage), già pianificato nel CLAUDE.md.
- Collezioni: `mercati`, `posteggi`, `espositori` (dati pubblici), `espositori_riservati` (CF, P.IVA, indirizzo: solo admin), `presenze` (una per giorno/espositore), `staff` (uid → ruolo), `eventi`.
- **Ruoli** con custom claims Firebase: `admin`, `operatore`, opzionale `suap`. Regole Firestore: lettura pubblica solo dei dati pubblici; scritture solo staff; presenze scrivibili da operatore e admin.
- Login: email + password (o link magico via email) creati dall'admin. Niente più password hardcoded.
- Pannello admin: CRUD espositori, assegnazione posteggi, gestione staff, eventi, esportazione CSV.
- **Contenimento costi/letture**: un documento aggregato per mercato (`stato/{mercatoId}`) con la mappa presenze del giorno, così l'app pubblica fa 1 lettura invece di 250. Sufficiente il piano gratuito Spark; da decidere intestatario del progetto Firebase (Comune o 3seizero).

Alternativa senza vendor esterno: API PHP + MySQL sul Plesk già in uso (3seizero). Più lavoro per auth/realtime, nessun costo aggiuntivo e dati in Italia. Consigliata solo se il Comune non accetta Firebase/Google.

### Fase 2 — QR code e app Operatore (≈ 1,5 settimane)
- Ogni espositore in anagrafica ha un **token QR** (stringa casuale non indovinabile, revocabile/rigenerabile dall'admin). Il QR codifica un URL `…/app/#/v/<token>`: chi lo scansiona senza essere operatore vede solo la scheda pubblica; l'operatore loggato vede il pulsante "Conferma presenza".
- **Stampa QR**: dal backend, singolo o in blocco (PDF A4 con logo, denominazione, settore/posteggio). Il SUAP lo stampa a fine registrazione o lo consegna.
- **Scanner**: nell'app PWA, sezione "Operatore": fotocamera con `BarcodeDetector` nativo (Android/Chrome) e fallback libreria (`@zxing/browser`) per iOS. Esito: verde = concessionario in regola al proprio posteggio; giallo = occasionale registrato (da assegnare a un posteggio vacante, "spunta"); rosso = token sconosciuto o revocato.
- **Presenza** = documento `presenze/{data}_{espositoreId}` con ora, operatore, posteggio, metodo (qr/manuale). L'app pubblica colora verde chi ha una presenza oggi. A fine giornata tutto torna grigio senza cron.
- **Occasionali**: il flusso corretto è registrazione preventiva al SUAP (anagrafica + QR). Fallback per chi si presenta senza: l'operatore fa una "registrazione rapida" (denominazione, referente, telefono) segnata "da regolarizzare", visibile al SUAP.
- Alternativa/complemento: QR statico affisso su ogni posteggio, che l'espositore scansiona per auto-dichiararsi presente (stato "in attesa" finché l'operatore non conferma). Riduce il giro dell'operatore nei mercati grandi.

### Fase 3 — App pubblica (≈ 1 settimana)
- Tre mercati con dati reali: mappa per l'area mercatale; elenchi con ricerca e filtro settore per Coperto e Ortofrutticolo. Flag per mercato "presenze attive" (decidere se il QR vale anche per Coperto/Ortofrutta).
- Scheda espositore: alias (se compilato) altrimenti denominazione, referente, settore, posteggio ufficiale (es. "Settore A · fila 6 · n. 30"), superficie, descrizione, foto, WhatsApp, Telegram, "Portami qui a piedi".
- Navigazione a piedi: `https://www.google.com/maps/dir/?api=1&destination=LAT,LON&travelmode=walking`; su iOS senza Google Maps si può offrire Apple Maps (`maps://?daddr=LAT,LON&dirflg=w`). Google rispetta il travelmode se l'app è installata; via web lo preimposta.
- Rimozione demo: NEGOZI_COPERTO, NEGOZI_ORTO, 50 espositori inventati, password demo.
- Campi aggiuntivi da valutare insieme: email, sito/social, orari, pagamenti accettati (POS), tag prodotti tipici, lingua, "prenota/ordina" (citato nell'offerta come sviluppo futuro).

### Fase 4 — Raccolta contatti espositori
I contatti WhatsApp/Telegram e l'alias non sono negli elenchi SUAP. Proposta: **scheda self-service**. Dall'URL del proprio QR l'espositore (o dal link inviato dal SUAP) compila alias, referente, WhatsApp, Telegram, descrizione, foto e accetta l'informativa privacy; l'admin approva. Alternativa: modulo cartaceo al SUAP e inserimento manuale (più lento).

### Fase 5 — Microsito (≈ 1 settimana)
- Rebranding "Mercati di Maglie": hero con i 3 mercati, per ciascuno indirizzo, giorni, orari, mappa Google, link diretto alla sezione dell'app.
- Numeri aggiornati (257 posteggi, 5 settori, imprese) calcolati dai dati, non hardcoded.
- Sezione "Sei un espositore?": procedura SUAP, come ottenere il QR, link alla scheda self-service, FAQ.
- Privacy policy e cookie (l'app raccoglie contatti e presenze).
- Eventi letti dallo stesso database dell'app (un solo punto di inserimento).

### Fase 6 — Test sul campo e go-live
- Prova reale un sabato con l'operatore: scansione di 20–30 QR, verifica copertura rete nell'area, tempi.
- Formazione: 1 ora operatore, 1 ora SUAP/admin. Manuale breve in PDF.
- Verifica desktop + mobile prima di ogni deploy (regola già in memoria).

Sviluppi successivi (già in CLAUDE.md): push notifications, Share/Contacts API, dominio mercatomaglie.it, admin separato, riattivazione targhe/OCR se richiesto.

---

## 4. Decisioni richieste a Carlo / Comune
1. Mappatura codici ufficiali ↔ postazioni: opzione A, B o C (§3.1 punto 3). C'è il DWG?
2. Elenchi mancanti: opere dell'ingegno, prodotti vari, uova. La piantina 2017 è ancora valida?
3. Giorni/orari/indirizzo ufficiali dei 3 mercati (incongruenza Via Toma Nuzzichi vs Piazza Immacolata).
4. Chi sono gli operatori (Polizia Locale? ufficio?), quanti dispositivi, quale metodo di login.
5. Presenze/QR anche per Coperto e Ortofrutticolo, o solo area mercatale?
6. Raccolta contatti: scheda self-service con approvazione o modulo SUAP?
7. Firebase (consigliato) o backend PHP/MySQL su Plesk? Intestatario del progetto.
8. Privacy: informativa per espositori, consenso alla pubblicazione dei contatti, nomina di 3seizero come responsabile del trattamento.

## 5. Ordine di esecuzione proposto
Fase 0 può partire subito (tag, rimozione targhe, import dati, seed). La riconciliazione mappa dipende dalla decisione 1. Fase 1 e 2 dipendono dalla decisione 7. Il microsito può procedere in parallelo dopo la decisione 3.
