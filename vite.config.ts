import { defineConfig } from 'vite';

export default defineConfig({
  // Esta es la línea mágica que corrige las rutas para Supabase Storage
  base: './', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});