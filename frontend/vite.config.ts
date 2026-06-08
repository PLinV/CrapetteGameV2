import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // on ajoute la configuration pour Vitest ici
  test: {
    environment: 'jsdom', // simule un navigateur
    globals: true, // permet d'utiliser describe/it/expect sans les importer à chaque fois
    setupFiles: './src/setupTests.ts', // un fichier pour initialiser des choses avant les tests
  }
})