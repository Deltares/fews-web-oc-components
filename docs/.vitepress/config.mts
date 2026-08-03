import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'FEWS Web OC',
  description: 'Documentation for FEWS Web OC components and composables.',
  lang: 'en-US',
  base: process.env.VITEPRESS_BASE ?? '/fews-web-oc-components/',
  ignoreDeadLinks: ['/storybook/', '/storybook/index'],
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Components', link: '/components/' },
      { text: 'Composables', link: '/composables/' },
      { text: 'Storybook', link: '/storybook/' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' }
          ]
        }
      ],
      '/components/': [
        {
          text: 'Components',
          items: [
            { text: 'Overview', link: '/components/' },
            { text: 'DateTimeSlider', link: '/components/date-time-slider' },
            { text: 'ColourBar', link: '/components/colour-bar' }
          ]
        }
      ],
      '/composables/': [
        {
          text: 'Composables',
          items: [
            { text: 'Overview', link: '/composables/' },
            { text: 'useWms', link: '/composables/use-wms' }
          ]
        }
      ]
    },
    search: {
      provider: 'local'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Deltares/fews-web-oc-components' }
    ]
  }
})
