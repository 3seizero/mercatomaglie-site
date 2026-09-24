# Migrazione su mercati.visitmaglie.com — verifica del server e guida passo passo

Data: 24/09/2026. Origine: `https://3seizero.com/projects/maglie/areamercatale/` (Plesk, deploy GitHub → webhook).
Destinazione: `https://mercati.visitmaglie.com/` (sito alla radice, app in `/app/`, pannello in `/admin/`).

---

## 1. Cosa richiede il progetto (requisiti)

Il progetto è **interamente statico**: HTML, CSS, JavaScript, immagini, font. Il backend è Firebase (Firestore + Auth) e non cambia con la migrazione. Sul server non serve PHP, Node, database o cron.

| Requisito | Perché | Obbligatorio |
|---|---|---|
| Hosting di file statici con nginx o Apache | serve solo file | sì |
| **HTTPS con certificato valido** sul sottodominio | PWA, fotocamera (scanner QR) e GPS funzionano solo in contesto sicuro; Firebase Auth rifiuta domini non https | sì |
| Sottodominio con **document root dedicato** (non dentro il WordPress di www) | il sito ha la sua `index.html` alla radice; WordPress non deve intercettare le richieste | sì |
| Deploy da GitHub (estensione Git di Plesk con webhook) oppure SFTP/SSH | oggi il push su `main` pubblica in automatico | consigliato |
| Possibilità di impostare header HTTP per singoli file (`.htaccess` oppure "direttive nginx aggiuntive" di Plesk) | `sw.js` deve essere servito senza cache, `site.webmanifest` con il MIME giusto | consigliato |
| Spazio: circa 10 MB (app 3 MB, pannello 3 MB, immagini 3 MB) | | sì |
| Compressione gzip/brotli | il bundle dell'app è 1,3 MB non compresso | consigliato |
| Il vecchio indirizzo su 3seizero.com resta attivo come **redirect 301** | i QR già stampati contengono l'URL vecchio | sì, finché ci sono QR vecchi in giro |

## 2. Verifica del server di destinazione (fatta da fuori il 24/09/2026)

| Voce | Esito |
|---|---|
| `mercati.visitmaglie.com` | **non esiste ancora nel DNS**: nessun record A o CNAME. Va creato (punto 3.1). |
| `visitmaglie.com` / `www` | risolvono su `178.32.137.44` (OVH), reverse DNS `visitmaglie.com` |
| Pannello di controllo | **Plesk** (porta 8443 attiva, header `X-Powered-By: PleskLin`): stesso ambiente del server attuale, quindi il deploy da GitHub con webhook si replica identico |
| Web server | nginx davanti (Plesk: nginx + Apache, oppure solo nginx) |
| Sito esistente | WordPress su `www.visitmaglie.com` (PHP 8.4): non va toccato; il sottodominio avrà una cartella separata |
| DNS gestito da | `dns200.anycast.me` / `ns200.anycast.me` (OVH): il record si crea dal pannello OVH o dal DNS di Plesk, a seconda di dove è delegata la zona |
| HTTPS | Let's Encrypt disponibile in Plesk: il certificato per il sottodominio si emette in un clic dopo che il DNS punta al server |

Verdetto: **il server è adatto**, non manca nulla di strutturale. Da fare: record DNS, sottodominio in Plesk, certificato, deploy Git. La verifica dall'interno (versione Plesk, estensione Git installata, nginx-only o nginx+Apache) la faccio quando ho l'accesso.

## 3. Guida passo passo

Legenda: **[Carlo]** lo fai tu sul pannello; **[Claude]** lo faccio io nel codice o con gli script.

### 3.1 DNS **[Carlo]**
1. Nella zona DNS di `visitmaglie.com` (OVH Manager → Domini → visitmaglie.com → Zona DNS, oppure Plesk → Impostazioni DNS se la zona è gestita lì) aggiungi:
   `mercati` · tipo **A** · valore `178.32.137.44` · TTL predefinito.
2. Attendi la propagazione (da pochi minuti a un'ora). Verifica: `dig +short mercati.visitmaglie.com` deve rispondere `178.32.137.44`.

### 3.2 Sottodominio in Plesk **[Carlo]**
1. Plesk → Siti web e domini → **Aggiungi sottodominio**: nome `mercati`, dominio padre `visitmaglie.com`.
2. Document root: lascia `mercati.visitmaglie.com` (cartella dedicata, fuori dal WordPress).
3. Impostazioni hosting: PHP può restare attivo ma non serve; lascia "Accesso SSL/TLS" abilitato.
4. **Certificato**: Siti web e domini → mercati.visitmaglie.com → SSL/TLS Certificates → Let's Encrypt → includi il sottodominio → Installa. Attiva "Reindirizzamento permanente da HTTP a HTTPS".

### 3.3 Deploy da GitHub **[Carlo]**, con il webhook già pronto **[Claude]**
1. Plesk → mercati.visitmaglie.com → **Git** (estensione Git; se manca: Estensioni → cerca "Git" → installa, è gratuita).
2. Aggiungi repository: URL `https://github.com/3seizero/mercatomaglie-site.git`, branch `main`, modalità "Deploy automatico", cartella di destinazione = document root.
   Il repo è pubblico: non servono chiavi. Se in futuro diventasse privato, Plesk mostra una chiave SSH da aggiungere alle Deploy keys di GitHub.
3. Plesk mostra un **URL webhook**: copialo.
4. GitHub → repository → Settings → Webhooks → Add webhook: Payload URL = quello di Plesk, Content type `application/json`, evento "Just the push". Salva.
5. Da questo momento ogni push su `main` pubblica sul nuovo server. Il primo deploy lo lanci a mano da Plesk con "Distribuisci ora".

### 3.4 Adeguamento del codice **[Claude]**
Lo faccio in un commit dedicato quando il sottodominio risponde:
1. `base` di Vite: app `/app/`, pannello `/admin/` (oggi `/projects/maglie/areamercatale/...`); percorsi resi parametrici con variabili d'ambiente così un cambio futuro non richiede modifiche al codice.
2. URL dell'app nei QR (`APP_URL` in `admin-src/src/api.js`) e link al marchio nei fogli di stampa.
3. `site.webmanifest`: `start_url` e `scope` = `/app/`.
4. Link "Apri il pannello" nell'app e "Apri l'app pubblica" nel pannello.
5. Header: `.htaccess` (o direttive nginx) con `Cache-Control: no-cache` per `sw.js` e `registerSW.js`, MIME `application/manifest+json` per `.webmanifest`, cache lunga per `assets/`.
6. Documentazione e microsito (indirizzo scritto nei pannelli 70×100 e nel materiale social: da `3seizero.com/projects/maglie/areamercatale/app` a `mercati.visitmaglie.com/app`).

### 3.5 Firebase **[Claude]**, senza costi
1. Authentication → Domini autorizzati: aggiungo `mercati.visitmaglie.com` (altrimenti il login risponde "unauthorized domain").
2. Restrizioni della chiave web (API key): aggiungo i referrer `https://mercati.visitmaglie.com/*` e `https://*.visitmaglie.com/*` con gcloud, altrimenti Firestore risponde 403.
3. I domini vecchi restano autorizzati per il periodo di transizione.

### 3.6 Collaudo **[Claude, poi Carlo dal telefono]**
1. Test automatici in browser contro il nuovo dominio (app, operatore, pannello, QR): la stessa suite usata finora, 35 controlli.
2. Controllo manuale dal telefono: installazione della PWA dal nuovo indirizzo, scanner QR, GPS, login operatore.
3. Controllo dal tablet vecchio: pagina non bianca, menu del sito.

### 3.7 Redirect dal vecchio indirizzo **[Claude]** (serve accesso al Plesk di 3seizero.com, che ho)
1. In `/projects/maglie/areamercatale/` sostituisco i file con un `.htaccess` che fa 301 verso il nuovo dominio conservando il percorso:
   `.../areamercatale/app/#/v/TOKEN` → `https://mercati.visitmaglie.com/app/#/v/TOKEN` (il frammento `#` resta sul browser e sopravvive al redirect).
2. Così i QR già stampati continuano a funzionare. I nuovi QR generati dal pannello escono con il nuovo URL.
3. Il vecchio webhook Plesk su 3seizero.com va disattivato, altrimenti ogni push riscrive i file sopra il redirect.

### 3.8 Dopo la migrazione **[Carlo]**
1. Chi ha l'app installata dal vecchio indirizzo la vede come un'altra app: va rimossa e reinstallata da `mercati.visitmaglie.com/app`. Metto un avviso sulla pagina vecchia.
2. Aggiorna l'indirizzo nei pannelli, nei social e nella locandina prima della stampa.
3. Segnala al SUAP e agli operatori il nuovo indirizzo del pannello: `mercati.visitmaglie.com/admin`.

## 4. Ordine consigliato e tempi

| Passo | Chi | Tempo |
|---|---|---|
| 3.1 DNS | Carlo | 5 min + propagazione |
| 3.2 sottodominio + certificato | Carlo | 10 min |
| 3.3 Git e webhook | Carlo | 10 min |
| 3.4 codice | Claude | 30 min |
| 3.5 Firebase | Claude | 5 min |
| 3.6 collaudo | Claude + Carlo | 20 min |
| 3.7 redirect vecchio | Claude | 10 min |

Il sito attuale resta online per tutto il tempo: la migrazione non ha interruzioni. L'unico momento delicato è il 3.7, che va fatto solo dopo il collaudo positivo.

## 5. Cosa serve da Carlo per procedere

- Accesso al Plesk di visitmaglie.com (URL `https://178.32.137.44:8443` o quello con nome, utente) oppure fare tu i passi 3.1–3.3 seguendo la guida e mandarmi l'URL webhook.
- Conferma della struttura: radice = sito, `/app/`, `/admin/`.
- Conferma che 3seizero.com resta attivo come redirect finché esistono QR vecchi.
