# Componenti di riferimento

`componenti.css` è lo stile dei componenti del design system (usa le variabili di `../tokens.css`). Non va incluso così com'è: serve come riferimento per replicare nel codice esistente gli stessi valori.

| Componente | Classi | Cosa è |
|---|---|---|
| Button | `.mm-btn` + `.mm-btn-primary` / `-cta` / `-neutral`, `.mm-btn-md` (40 px) / `-lg` (48 px) | primario fondo terra, CTA fondo ocra, neutro fondo sabbia-scura; peso 700, raggio 10 px |
| StallBadge | `.mm-stall`, `.is-present` | codice posteggio in quadrato 46×46, bordo 1,5 px, verde se presente |
| StatusPill | `.mm-pill`, `.mm-pill-item`, `.mm-dot` | pill sopra la mappa, fondo terra semitrasparente, pallini colorati |
| CategoryTag | `.mm-tag` | categoria in maiuscoletto ocra su ocra-tint |
| ExhibitorCard | `.mm-card`, `.mm-card-num`, `.mm-card-name`, `.mm-card-contact` | scheda espositore: numero in riquadro sabbia-scura, nome 15 px 700 |
| Lockup | `.mm-lockup` | usare gli SVG di `../../marchio/svg/lockup/` invece di ricostruirlo in HTML |
