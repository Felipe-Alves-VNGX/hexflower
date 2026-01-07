import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, 'src/init.js'),
      name: 'hexflower',
      fileName: 'module',
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        assetFileNames: "style.[ext]", 
      },
    },
    sourcemap: true,
    minify: 'terser',
  },
});
