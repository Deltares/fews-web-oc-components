import type { Preview } from '@storybook/vue3-vite'
import { setup } from '@storybook/vue3-vite'
import { VApp } from 'vuetify/components'
import vuetify from '../src/plugins/vuetify'
import './preview.css'

setup((app) => {
  app.use(vuetify)
})

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Vuetify theme',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: [
    (story, context) => ({
      components: { VApp },
      setup() {
        return { theme: context.globals.theme ?? 'light' }
      },
      template:
        '<v-app :theme="theme" class="storybook-app"><story /></v-app>',
    }),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
}

export default preview
