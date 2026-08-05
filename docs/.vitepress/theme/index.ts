import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import ExternalResourceLink from './ExternalResourceLink.vue'
import './style.css'

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ExternalResourceLink', ExternalResourceLink)
  },
}

export default theme