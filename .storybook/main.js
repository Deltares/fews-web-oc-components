const path = require('path')

module.exports = {
  stories: ['../src/**/*.stories.[tj]s'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-docs'
  ]
}
