import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'


import path from 'path';


// https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })



// import reactRefresh from '@vitejs/plugin-react-refresh';



const SRC_DIR = path.resolve(__dirname, './src');
const PUBLIC_DIR = path.resolve(__dirname, './public');
const BUILD_DIR = path.resolve(__dirname, './www',);

export default defineConfig({
  plugins: [
    react(),
  ],
  //root: SRC_DIR,
  // base: '',
  // publicDir: PUBLIC_DIR,
  build: {
    sourcemap: false,
    outDir: BUILD_DIR,
    assetsInlineLimit: 0,
    emptyOutDir: true,
    rollupOptions: {
      treeshake: true,
    },
  },
  resolve: {
    alias: {
      '@': SRC_DIR,
    },
  },
  server: {
    //host: true,
    proxy: {
      //https://www.vitejs.net/config/#server-proxy
      '/api': {
        target: 'http://127.0.0.1:18000',
        changeOrigin: true,
        //rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },

})
