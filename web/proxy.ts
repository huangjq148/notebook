export const proxy = {
  '/api/': {
    target: `http://localhost:3000/`,
    rewrite: (path) => path.replace(/^\/api/, ''),
    // target: `http://${config.VITE_APP_SERVER}:${config.VITE_APP_SERVER_PORT}`,
    changeOrigin: true,
  },
}