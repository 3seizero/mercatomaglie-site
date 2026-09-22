# Design system "Mercati di Maglie" — token e regole (per Claude Design)

Fonte di verità: web app (`app-src/src/App.jsx`, oggetto `S` e `T`) e microsito (`index.html`, variabili CSS `:root`).

## Colori
| Nome | Hex | Uso |
|---|---|---|
| terra | #3d2b1a | fondi scuri (header, nav, bottoni primari), testo su chiaro |
| terra-testo | #2c1d0e | testo principale su fondo chiaro |
| terra-medio | #6b5040 | testo secondario |
| terra-chiaro | #9a8070 | didascalie, etichette, placeholder |
| ocra | #c8862a | accento principale, bottoni CTA, linee, badge |
| ocra-chiaro | #e8a045 | accento su fondo scuro, parole in corsivo dei titoli, icone attive |
| sabbia | #f5f0e8 | fondo pagina chiaro |
| sabbia-scura | #e8dfc8 | riquadri secondari, bottoni neutri, numeri |
| bordo | #d8c8b0 | bordi di card e input |
| bianco | #ffffff | card |
| verde-presenza | #3daa70 | "presente", stato positivo (fondo chiaro #eaf7f0) |
| rosso-assenza | rgba(210,40,40,0.5) su mappa; testo #c0392b; fondo #fdecea | "assente", errori |
| blu-navigazione | #2595ff | pulsante "A piedi", posizione utente |
| verde-whatsapp | #22c55e · azzurro-telegram #2aabee | pulsanti contatto |
Mappa: strade #706f6f, area mercato #ffffff, parcheggi #e6d867, aiuole #9ec583, piazza eventi #d38267, postazione libera #e8e2d8 (bordo #c8c0b4), postazione assegnata fuori orario #d9c9ad.

## Tipografia
- Famiglia unica: **Montserrat** (Google Fonts). Pesi: 300 e 400 testi lunghi, 500 e 600 UI, 700 e 800 titoli, etichette e numeri.
- Serif opzionale per titoli editoriali: **Playfair Display**, solo la parola chiave in corsivo colore ocra-chiaro (es. "Il mercato *più amato* del Salento").
- Etichette in maiuscoletto: 9–10 px in app, letter-spacing 2–5 px, peso 700, colore terra-chiaro o ocra.
- Scala app: titolo pagina 16–20, nome scheda 15–16, testo 12–13, didascalie 10–11. Scala stampa: moltiplicare per 2,5–3 e non scendere sotto 26 pt su pannelli 70×100.

## Forme e spazi
- Raggio: 14 px card, 10 px bottoni e input, 20 px fogli inferiori (bottom sheet), 50% pallini di stato.
- Bordi: 1–1,5 px colore bordo; ombra morbida 0 1px 6px rgba(0,0,0,0.05) sulle card.
- Spaziatura base 4 px; padding card 14–16 px; gap liste 8–10 px.
- Bottoni: primario fondo terra testo bianco; CTA fondo ocra testo bianco; neutro fondo sabbia-scura testo terra; tutti peso 700, altezza 40–48 px, angoli 10 px.

## Componenti ricorrenti
- **Badge posteggio**: quadrato 46×46, bordo 1,5 px, codice in 10 px peso 900 (es. "A 30"); verde se presente, grigio altrimenti.
- **Pill di stato** (mappa): fondo terra scuro semitrasparente, pallini colorati + testo bianco 11 px 700.
- **Card espositore**: numero in riquadro sabbia-scura a sinistra, nome 15 px 700 terra, referente 11 px terra-chiaro, categoria in tag maiuscoletto ocra su #fdf0e0.
- **Logo**: portale del mercato con tre tende e sole (file `app/logo.svg`), versione chiara su fondo terra; lettering "AREA MERCATALE" 700 spaziato 2 px, sotto "MAGLIE" 500 spaziato 4–5 px in ocra-chiaro.

## Tono
Istituzionale ma caldo, frasi brevi, italiano, seconda persona singolare ("Trova subito quello che ti serve").
