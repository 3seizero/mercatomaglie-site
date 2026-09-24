import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
// Pannello di gestione: sorgenti in admin-src/, build in ../admin (servito a /areamercatale/admin/).
// Usa la stessa configurazione Firebase dell'app (app-src/.env.local).
export default defineConfig({
  base: '/projects/maglie/areamercatale/admin/',
  envDir: '../app-src',
  build: { outDir: '../admin', emptyOutDir: true },
  plugins: [
    react(),
    // Compatibilità con i browser vecchi (Chrome 60-80 sui tablet Android 2018): bundle legacy con polyfill
    legacy({ targets: ['chrome >= 60', 'android >= 7', 'safari >= 12', 'firefox >= 60', 'not dead'], modernTargets: 'chrome >= 64, safari >= 12, firefox >= 60, edge >= 79, chromeAndroid >= 64, iOS >= 12', modernPolyfills: true, renderLegacyChunks: true }),
  ],
})
