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
    './critical_points_overview':
      './src/components/CriticalPointsOverview.vue',
  },
  shared: {
    vue: {
      singleton: true,
    },
    'vuetify/lib/framework.mjs': { singleton: true },
    '@deltares/fews-web-oc-composables': { singleton: true },
  },
})
