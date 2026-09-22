import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// Pannello di gestione: sorgenti in admin-src/, build in ../admin (servito a /areamercatale/admin/).
// Usa la stessa configurazione Firebase dell'app (app-src/.env.local).
export default defineConfig({
  base: '/projects/maglie/areamercatale/admin/',
  envDir: '../app-src',
  build: { outDir: '../admin', emptyOutDir: true },
  plugins: [react()],
})
