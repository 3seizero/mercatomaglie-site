# Guida per il Comune — presa in carico del progetto Firebase

Destinatario: la persona incaricata dal Comune di Maglie (ufficio SUAP o servizi informatici).
Scopo: diventare **proprietario** del progetto Firebase «Mercati di Maglie», oggi intestato a
3seizero per ragioni di velocità di sviluppo, senza interrompere il servizio e senza spostare dati.

Tempo necessario: circa 30 minuti in tutto, in due momenti distinti. Non serve competenza tecnica:
si tratta di aprire un account e accettare un invito.

---

## Cos'è Firebase e perché serve un intestatario

Firebase è il servizio Google su cui girano il database della web app (elenco espositori,
posteggi, presenze giornaliere), il sistema di accesso degli operatori e, in prospettiva, le foto
delle bancarelle. Ogni progetto Firebase appartiene a un account Google. Chi ne è proprietario
controlla i dati, gli accessi e l'eventuale fatturazione. Per questo, a regime, il proprietario
deve essere il Comune.

## Fase 1 — Aprire l'account del Comune (10 minuti)

1. Scegliere un **indirizzo email istituzionale** dedicato, non personale, per esempio
   `mercati@comune.maglie.le.it` oppure `servizi.informatici@comune.maglie.le.it`.
   Deve essere una casella a cui l'ente avrà accesso anche in caso di cambio del personale.
2. Andare su <https://accounts.google.com/signup> e scegliere **«Utilizza il mio indirizzo
   email attuale»**: si crea un account Google collegato a quella casella, senza aprire una
   Gmail. Completare la verifica via email.
3. Attivare la **verifica in due passaggi** su <https://myaccount.google.com/security>
   (consigliato: app Google Authenticator o SMS su un cellulare dell'ufficio).
4. Conservare le credenziali secondo le procedure interne dell'ente.

Comunicare a 3seizero l'indirizzo dell'account creato. Non comunicare mai la password.

## Fase 2 — Accettare l'invito e diventare proprietario (10 minuti)

3seizero invia un invito come **Proprietario** del progetto.

1. Aprire l'email «Sei stato invitato a collaborare al progetto Firebase mercati-maglie» e
   cliccare **Accetta invito**, accedendo con l'account creato nella Fase 1.
2. Accettare i termini di servizio di Firebase e Google Cloud quando richiesto.
3. Verificare su <https://console.firebase.google.com> che il progetto compaia nell'elenco.
4. Aprire **Impostazioni progetto → Utenti e autorizzazioni** e controllare che l'account del
   Comune abbia il ruolo **Proprietario**.

Da questo momento il Comune è a tutti gli effetti proprietario. I dati non si spostano: cambia
solo chi detiene il progetto.

## Fase 3 — Definire i ruoli a regime (5 minuti)

Nella stessa pagina **Utenti e autorizzazioni**:

- **Comune** (account istituzionale): Proprietario.
- **3seizero** (`carlo@3seizero.com`): **Editor** per manutenzione e aggiornamenti, oppure
  Proprietario se il Comune preferisce mantenere due proprietari per sicurezza. Google
  raccomanda sempre **almeno due proprietari** per non perdere l'accesso al progetto.
- Eventuali altri dipendenti: **Visualizzatore**.

Nota: questi ruoli riguardano la console tecnica. Gli accessi all'app (Admin, Operatore) sono
un'altra cosa e si gestiscono dal pannello di gestione della web app.

## Fase 4 — Fatturazione (solo se e quando servirà)

Il progetto usa il **piano gratuito (Spark)**, sufficiente per i volumi del mercato: database,
accessi e notifiche non costano nulla. Il piano a consumo (**Blaze**) diventa necessario solo
per attivare l'archivio delle **foto delle bancarelle**; anche in quel caso i consumi previsti
restano dentro le soglie gratuite e il costo atteso è di pochi centesimi al mese.

Se si decide di attivarlo:

1. In console, in basso a sinistra, **Spark → Esegui l'upgrade** → Blaze.
2. Collegare un account di fatturazione Google Cloud intestato al Comune (serve una carta o un
   metodo di pagamento dell'ente; per gli enti pubblici Google Cloud accetta anche la fattura
   tramite rivenditore).
3. Impostare subito un **budget con avviso**, per esempio 5 € al mese, in Google Cloud →
   Fatturazione → Budget e avvisi. Così qualsiasi anomalia viene segnalata via email.

## Cosa NON fare

- Non eliminare il progetto né rimuovere 3seizero prima di aver concordato la fine
  dell'assistenza: si perderebbe la manutenzione.
- Non cambiare le regole di sicurezza (Firestore Rules) dalla console: sono gestite dal codice.
- Non creare utenti dell'app dalla console Firebase: si fa dal pannello di gestione.

## Adempimenti privacy

I dati degli espositori (anagrafica, codice fiscale, partita IVA, contatti, presenze) sono
trattati dal Comune come **titolare**. 3seizero va nominata **responsabile del trattamento**
con un atto scritto (art. 28 GDPR). Google, come fornitore di Firebase, è sub-responsabile
secondo i propri termini (Google Cloud Data Processing Addendum); i dati risiedono nella regione
europea scelta alla creazione del database.

## Riferimenti

- Console Firebase: <https://console.firebase.google.com>
- Gestione ruoli: Impostazioni progetto → Utenti e autorizzazioni
- Assistenza: 3seizero, carlo@3seizero.com
