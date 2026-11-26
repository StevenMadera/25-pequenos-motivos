
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
  ],

  base: mode === 'production'
    ? '/25-pequenos-motivos/'
    : '/',

  build: {
    outDir: 'dist',
    sourcemap: false,
    assetsDir: 'assets',
  },
}))
