import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path';


function pathResolve(dir: string) {
  return resolve(__dirname, '.', dir);
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
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
    ]
  },
  server: {
    proxy: {
      '/api/': {
        // target: `https://sdk-preview.sofunny.io`,
        target: `http://localhost:3000/`,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // target: `http://10.30.60.81:9080`,
        // target: `http://${config.VITE_APP_SERVER}:${config.VITE_APP_SERVER_PORT}`,
        changeOrigin: true,
      },
    }
  }
})
