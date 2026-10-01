import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { federation } from '@module-federation/vite'
import vuetify from 'vite-plugin-vuetify'
import mfConfig from './module-federation.config.ts'

const isStorybookRun =
  Boolean(process.env.STORYBOOK) ||
  Boolean(process.env.STORYBOOK_BASE) ||
  process.env.npm_lifecycle_event?.includes('storybook') === true

const base =
  process.env.MICRO_FRONTEND_BASE ??
  'http://localhost:2010/'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  cacheDir: mode === 'demo' ? 'node_modules/.vite-demo' : undefined,
  server: {
    origin: 'http://localhost:2010',
    port: 2010,
  },
  base,
  plugins: [
    vue(),
    ...(isStorybookRun || mode === 'demo' ? [] : [federation(mfConfig)]),
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
}))
