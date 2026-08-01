import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'; // <--- Adicione este import

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <--- Adicione o plugin aqui
  ],
});