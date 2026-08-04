import type { StorybookConfig } from '@storybook/vue3-vite'
import { mergeConfig } from 'vite'

import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

function getAbsolutePath(value: string) {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)))
}

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-vitest'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath('@storybook/addon-onboarding'),
  ],
  framework: getAbsolutePath('@storybook/vue3-vite'),
  async viteFinal(config) {
    return mergeConfig(config, {
      publicDir: false,
      base: process.env.STORYBOOK_BASE ?? '/',
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('../src', import.meta.url)),
        },
      },
    })
  },
}

export default config
