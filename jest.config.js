module.exports = {
  preset: '@vue/cli-plugin-unit-jest/presets/typescript',
  transformIgnorePatterns: ['node_modules/(?!vue-router|@babel|vuetify)'],
  setupFiles: ['./tests/setup.ts'],
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/src/**/*.vue'],
  coverageReporters: ['text-summary', 'html', 'lcov', 'clover']
}
