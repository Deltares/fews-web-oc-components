import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { federation } from '@module-federation/vite'
import vuetify from 'vite-plugin-vuetify'
import mfConfig from './module-federation.config.ts'

// https://vite.dev/config/
export default defineConfig({
  server: {
    origin: 'http://localhost:2010',
    port: 2010,
  },
  base: 'http://localhost:2010/',
  plugins: [
    vue(),
    federation(mfConfig),
    vuetify({
      autoImport: true,
    }),
  ],
  optimizeDeps: {
    exclude: ['vuetify'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'chrome89',
  },
})
