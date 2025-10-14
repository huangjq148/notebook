import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { inspectorServer } from '@react-dev-inspector/vite-plugin';
import { proxy } from './proxy';

function pathResolve(dir: string) {
  return resolve(__dirname, '.', dir);
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [inspectorServer(), react()],
  base: './',
  resolve: {
    alias: [
      {
        find: /^~/,
        replacement: pathResolve('node_modules') + '/',
      },
      {
        // /@/xxxx  =>  src/xxx
        find: /@\//,
        replacement: pathResolve('src') + '/',
      },
    ],
  },
  server: {
    port: 8001,
    host: true,
    proxy,
  },
});
