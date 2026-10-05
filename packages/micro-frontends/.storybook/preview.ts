import type { Preview } from '@storybook/vue3-vite'
import { setup } from '@storybook/vue3-vite'
import { createVuetify } from 'vuetify'
import { mdi } from 'vuetify/iconsets/mdi'
import { VApp } from 'vuetify/components'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

const vuetify = createVuetify({ icons: { defaultSet: 'mdi', sets: { mdi } } })

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
