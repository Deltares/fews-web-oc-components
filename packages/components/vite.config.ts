import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    dts(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'fews-web-oc-components',
      fileName: 'fews-web-oc-components',
    },
    rolldownOptions: {
      external: ['vue', '@deltares/fews-web-oc-charts', 'd3', 'vuetify/components'],
      output: {
        globals: {
          vue: 'Vue',
          '@deltares/fews-web-oc-charts': 'webOcCharts',
          d3: 'd3',
          'vuetify/components': 'vuetifyComponents',
        },
      },
    },
  },
})