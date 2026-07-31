import { createModuleFederationConfig } from '@module-federation/vite'

export default createModuleFederationConfig({
  filename: 'remoteEntry.js',
  name: 'test-micro-frontend',
  manifest: true,
  dts: {
    tsConfigPath: './tsconfig.app.json',
  },
  exposes: {
    './main_component': './src/components/MainComponent.vue',
  },
  shared: {
    vue: {
      singleton: true,
    },
    'vuetify/lib/framework.mjs': { singleton: true },
  },
})