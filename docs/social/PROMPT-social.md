# Prompt per Claude Design — set grafico social per il lancio della web app "Area Mercatale di Maglie"

## Canali istituzionali del Comune di Maglie (verificati il 22/09/2026)

- **Facebook**: facebook.com/ComunediMaglie — canale principale, quello che pubblica di più.
- **YouTube**: youtube.com/@comunedimaglie2519 — dirette e video del consiglio.
- **WhatsApp "MaglieInforma"**: servizio di avvisi del Comune via messaggi WhatsApp.
- **Sito**: comune.maglie.le.it, con spazio per news e banner in home.
- **Instagram**: il Comune non ha un profilo ufficiale; si prevede comunque il formato per eventuali pagine partner (Pro Loco, associazioni dei commercianti) e per un futuro profilo.

Allegare al prompt: il logo dell'app (`app/logo.svg`), gli screenshot dell'app (mappa, scheda espositore, elenco), l'anteprima della piantina (`data/mappa/area-mercatale-v2-anteprima.png`) e i loghi istituzionali quando disponibili.

---

Devi progettare un **set grafico coordinato per il lancio della web app "Area Mercatale di Maglie"** sui canali istituzionali del Comune di Maglie (Lecce). La web app mostra la mappa interattiva del mercato del sabato con 257 posteggi, gli espositori presenti in tempo reale, la scheda di ogni espositore con contatto WhatsApp o Telegram e la navigazione a piedi fino al banco; copre anche il Mercato Coperto (tutti i giorni) e il Mercato Ortofrutticolo (mercoledì). Si usa dal telefono senza installare nulla, e si può aggiungere alla schermata Home.

## Identità

Palette: terra `#3d2b1a`, ocra `#c8862a`, ocra chiaro `#e8a045`, sabbia `#f5f0e8`, sabbia scura `#e8dfc8`, bianco; verde `#3daa70` solo per il concetto "presente ora". Font Montserrat (300/400 testi, 700/800 titoli e maiuscoletto spaziato); Playfair Display in corsivo solo per la parola chiave dei titoli, come nel sito ("Il mercato *più amato* del Salento"). Logo: portale del mercato con tende e sole, allegato, sempre con il lettering "AREA MERCATALE · MAGLIE". Stile: caldo, pulito, molto spazio, angoli arrotondati, mockup del telefono con gli screenshot reali allegati; niente foto stock, niente icone generiche di "smartphone con onde wifi". Tono istituzionale ma amichevole, in italiano, frasi brevi.

## Messaggi (usa questi testi, non inventarne di diversi)

- Claim principale: **"Il mercato di Maglie, sul tuo telefono."**
- Secondario: "Chi c'è oggi, dove si trova, come raggiungerlo a piedi."
- Call to action: "Apri la mappa live" + indirizzo `3seizero.com/projects/maglie/areamercatale/app` (in futuro `mercatomaglie.it`: prevedi lo spazio) + QR code segnaposto.
- Tre messaggi per una mini-serie: (1) "Presenti ora: la mappa si colora di verde quando l'espositore è al suo posto." (2) "Portami lì: un tocco e ti guida a piedi fino al banco." (3) "Contatta l'espositore: WhatsApp o Telegram, un tap e sei in contatto."
- Messaggio per gli espositori: "Sei un espositore? Registrati al SUAP del Comune, ricevi il tuo QR e compari nell'app."
- Riga istituzionale in basso: loghi (segnaposto grigi "LOGO", tre) e dicitura del finanziamento in due righe, per ora "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt".

## Declinazioni richieste, con dimensioni esatte

**Facebook (canale principale)**
1. Post immagine di lancio, verticale **1080 × 1350 px** (4:5, occupa più schermo nel feed). Una versione con il claim + mockup, tre versioni per la mini-serie.
2. Post immagine quadrato **1080 × 1080 px**, stessa composizione adattata, per eventuali condivisioni.
3. Immagine di anteprima per la condivisione del link (Open Graph) **1200 × 630 px**: claim, logo, mockup, senza QR.
4. Copertina pagina **1640 × 924 px** con area di sicurezza centrale **1250 × 463 px** (sui telefoni si vede solo il centro): claim e mockup dentro l'area sicura.
5. Storia **1080 × 1920 px** con zona sicura di 250 px in alto e in basso: due varianti, lancio e "sei un espositore?".

**YouTube**
6. Miniatura video **1280 × 720 px**: claim grande, mockup, logo; testo leggibile in anteprima piccola.
7. Post della scheda Community **1080 × 1080 px** (riusa il quadrato).
8. Banner del canale **2560 × 1440 px** con area sicura **1546 × 423 px** al centro: variante discreta, da usare solo nel periodo di lancio.

**WhatsApp "MaglieInforma"**
9. Immagine allegata al messaggio **1080 × 1080 px**, con il claim, il QR grande e l'indirizzo scritto per esteso (nel messaggio il link è cliccabile, l'immagine deve reggere da sola).
10. Stato WhatsApp **1080 × 1920 px** (riusa la storia).

**Sito del Comune**
11. Banner in home **1200 × 400 px** e variante **600 × 400 px** per la colonna laterale delle news.
12. Immagine di testa per l'articolo/news **1200 × 675 px** (16:9).

**Instagram (per pagine partner o profilo futuro)**
13. Feed **1080 × 1350 px** (riusa il post 4:5), storie **1080 × 1920 px** con l'adesivo "link" al centro in basso, copertina reel **1080 × 1920 px** con zona sicura centrale 1080 × 1350.

**Stampa leggera, stesso impianto**
14. Locandina **A3 verticale** (297 × 420 mm, 3 mm di abbondanza) per bacheche comunali e negozi, con QR reale grande.
15. Adesivo tondo **Ø 8 cm** per i banchi: "Trovami sull'app" + QR + logo.

## Regole di composizione

- Ogni formato deve funzionare da solo, senza il testo del post. Il QR va sempre in basso a destra o al centro in basso, mai sotto i 3 cm di stampa o 220 px a schermo.
- I mockup del telefono usano gli screenshot allegati, con cornice sottile, ombra morbida, inclinazione massima 8°.
- Testi: massimo 12 parole per il titolo, massimo 20 per il sottotitolo. Nessun testo dentro le aree non sicure.
- Consegna: file PNG per ogni formato (sRGB) e PDF per stampa (CMYK), più un sorgente editabile con livelli per ogni famiglia (Facebook, YouTube, WhatsApp, Sito, Instagram, Stampa). Nomina i file `maglie-app_<canale>_<formato>_<versione>.png`.
- Fornisci anche un breve **piano di pubblicazione** in una pagina: ordine dei post nella settimana di lancio (lunedì annuncio, mercoledì "presenti ora", venerdì "portami lì", sabato mattina storia "oggi al mercato" con link, la settimana dopo il post per gli espositori), con i testi dei post pronti per Facebook e per il messaggio WhatsApp MaglieInforma (massimo 500 caratteri, con il link).
