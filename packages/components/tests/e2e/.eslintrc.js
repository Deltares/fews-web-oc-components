// eslint.config.js
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    env: {
      node: true,
    },
    extends: [
      'eslint:recommended',
      'plugin:vue/vue3-recommended',
      '@vue/eslint-config-typescript/recommended',
      '@vue/eslint-config-prettier',
    ],
    rules: {
    // override/add rules settings here, such as:
    // 'vue/no-unused-vars': 'error'
    },

  },
])
