import { defineConfig } from 'vite';

export default defineConfig({
  // El nombre del repositorio entre barras
  base: 'pilot-game-example/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});