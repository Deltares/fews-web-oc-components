import type { Preview } from '@storybook/vue3-vite'
import { setup } from '@storybook/vue3-vite'
import { createVuetify } from 'vuetify'
import { VApp } from 'vuetify/components'
import 'vuetify/styles'

const vuetify = createVuetify({})

setup((app) => {
  app.use(vuetify)
})

const preview: Preview = {
  decorators: [
    () => ({
      components: { VApp },
      template: '<v-app><story /></v-app>',
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
      test: 'todo',
    },
  },
}

export default preview
