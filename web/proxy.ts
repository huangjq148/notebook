export const proxy = {
  '/api': {
    target: `http://localhost:3000`,
    changeOrigin: true,
  },
};
