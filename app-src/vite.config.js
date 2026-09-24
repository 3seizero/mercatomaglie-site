import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // base relativa: la stessa build funziona in qualunque cartella (3seizero.com/projects/... e mercati.visitmaglie.com/app/)
  base: './',
  // Sorgenti in app-src/ (sviluppo), build pubblicata in ../app (produzione, committata)
  build: {
    outDir: '../app',
    emptyOutDir: true,
  },
  plugins: [
    react(),
    // Compatibilità con i browser vecchi (es. Chrome 60-80 sui tablet Android 2018): bundle legacy con polyfill
    // e polyfill anche per il bundle moderno (Object.fromEntries, Promise.allSettled, ecc.).
    legacy({
      targets: ['chrome >= 60', 'android >= 7', 'safari >= 12', 'firefox >= 60', 'not dead'],
      // il bundle "moderno" (caricato da chi supporta i moduli ES) viene abbassato a Chrome 64 / Safari 12:
      // senza questa opzione il plugin lo lascerebbe a Chrome 105 e i tablet del 2018 vedrebbero una pagina bianca
      modernTargets: 'chrome >= 64, safari >= 12, firefox >= 60, edge >= 79, chromeAndroid >= 64, iOS >= 12',
      modernPolyfills: true,
      renderLegacyChunks: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
      },
    }),
  ],
})
