import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      outDir: 'dist/types',
      tsconfigPath: './tsconfig.json',
      include: ['src'],
      insertTypesEntry: true
    })
  ],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'FewsWebOcComponents',
      formats: ['es', 'umd'],
      fileName: (format) => `fews-web-oc-components.${format}.js`
    }
  }
})
