import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginStorybook from 'eslint-plugin-storybook'

export default defineConfigWithVueTs(
  {
    name: 'components/files-to-lint',
    files: ['**/*.{js,mjs,cjs,ts,vue}'],
    languageOptions: {
      ecmaVersion: 2020,
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      quotes: [1, 'single'],
      semi: [1, 'never'],
      indent: [1, 2],
      'eol-last': [1, 'always'],
      '@typescript-eslint/no-var-requires': 1,
    },
  },

  globalIgnores(['**/dist/**', '**/coverage/**', '**/playwright-report/**', '**/test-results/**']),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  ...pluginStorybook.configs['flat/recommended'],
)
