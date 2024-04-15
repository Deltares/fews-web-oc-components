import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    dts(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'fews-web-oc-components',
      fileName: 'fews-web-oc-components',
    },
    rollupOptions: {
      external: ['vue', '@deltares/fews-web-oc-charts', 'luxon', 'd3', 'vuetify/components'],
      output: {
        globals: {
          vue: 'Vue',
          '@deltares/fews-web-oc-charts': 'webOcCharts',
          luxon: 'luxon',
          d3: 'd3',
          'vuetify/components': 'vuetifyComponents',
        },
      },
    },
  },
})
