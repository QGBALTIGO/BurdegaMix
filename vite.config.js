import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative assets also work under /BurdegaMix/ on GitHub Pages.
  base: './',
  build: { target: 'es2022', chunkSizeWarningLimit: 1200 },
})
