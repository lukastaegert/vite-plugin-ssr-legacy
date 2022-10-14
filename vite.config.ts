import legacy from '@vitejs/plugin-legacy';
import vue from '@vitejs/plugin-vue';
import {defineConfig} from 'vite';
import ssr from 'vite-plugin-ssr/plugin';
import generateHtml from './generateHtml';

const legacyPlugin = legacy({ modernPolyfills: true });

export default defineConfig({
  plugins: [
    vue(),
    ssr(),
    legacyPlugin,
    // generateHtml(legacyPlugin),
  ],
  build: {
    outDir: 'dist',
    // Ensure we are actually compatible with all browsers that support dynamic imports
    target: ['chrome63', 'firefox67', 'safari11.1', 'edge79'],
  },
});
