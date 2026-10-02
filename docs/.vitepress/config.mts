import { defineConfig } from 'vitepress'
import composablesApiSidebar from './composables-api-sidebar.json' with { type: 'json' }

// vitepress's dev command does not reliably report `command: 'serve'` to the
// config function, so detect the local dev server via the npm script name instead.
const isLocalDev = process.env.npm_lifecycle_event === 'docs:dev'

export default defineConfig({
  title: 'FEWS Web OC',
  description: 'Documentation for FEWS Web OC components and composables.',
  lang: 'en-US',
  base: process.env.VITEPRESS_BASE ?? (isLocalDev ? '/' : '/fews-web-oc-components/'),
  cleanUrls: true,
  transformPageData(pageData) {
    if (pageData.relativePath.startsWith('composables/api/')) {
      pageData.frontmatter.pageClass = 'api-reference'
    }
  },
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Components', link: '/components/' },
      { text: 'Composables', link: '/composables/' },
      { text: 'Micro Frontends', link: '/micro-frontends/' },
      { text: 'Storybook', link: '/storybook/' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [{ text: 'Getting Started', link: '/guide/getting-started' }],
        },
      ],
      '/components/': [
        {
          text: 'Components',
          items: [
            { text: 'Overview', link: '/components/' },
            { text: 'DateTimeSlider', link: '/components/date-time-slider' },
            { text: 'ColourBar', link: '/components/colour-bar' },
          ],
        },
      ],
      '/composables/api/': composablesApiSidebar,
      '/composables/': [
        {
          text: 'Composables',
          items: [
            { text: 'Overview', link: '/composables/' },
            { text: 'useLocations', link: '/composables/use-locations' },
            { text: 'useWms', link: '/composables/use-wms' },
            {
              text: 'useHostWebserviceContext',
              link: '/composables/use-host-webservice-context',
            },
            {
              text: 'useHostRefreshContext',
              link: '/composables/use-host-refresh-context',
            },
            { text: 'useNotifications', link: '/composables/use-notifications' },
          ],
        },
        {
          text: 'API Reference',
          items: [{ text: 'Overview', link: '/composables/api/' }],
        },
      ],
      '/micro-frontends/': [
        {
          text: 'Micro Frontends',
          items: [
            { text: 'Overview', link: '/micro-frontends/' },
            {
              text: 'Development Setup',
              link: '/micro-frontends/development',
            },
            {
              text: 'Configure in FEWS',
              link: '/micro-frontends/configure-in-fews',
            },
            {
              text: 'Locations',
              link: '/micro-frontends/load-fews-locations',
            },
            {
              text: 'Time Series Data',
              link: '/micro-frontends/load-fews-timeseries-data',
            },
          ],
        },
      ],
    },
    search: {
      provider: 'local',
    },
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/Deltares/fews-web-oc-components',
      },
    ],
  },
})


