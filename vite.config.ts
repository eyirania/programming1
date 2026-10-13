import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
 plugins:[react(),tailwindcss()],base:'./',
 test:{environment:'node',include:['tests/**/*.test.ts']},
 build:{rollupOptions:{output:{manualChunks:{
  math:['katex'],motion:['motion/react'],highlight:['prismjs'],storage:['dexie'],react:['react','react-dom/client','react-router-dom'],content:['./src/content/index.ts']
 }}}}
});
