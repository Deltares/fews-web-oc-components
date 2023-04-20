module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.vue$': 'vue-jest',
    '^.+\\.(js|jsx|ts|tsx)$': 'ts-jest'
  },
  testMatch: ['**/tests/unit/**/*.spec.(js|jsx|ts|tsx)|**/__tests__/*.(js|jsx|ts|tsx)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'vue'],
  transformIgnorePatterns: ['node_modules/(?!vue-router|@babel|vuetify)'],
  setupFiles: ['./tests/setup.ts'],
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/src/**/*.vue'],
  testResultsProcessor: 'jest-teamcity-reporter',
  coverageReporters: ['text-summary', 'html', 'lcov', 'clover', 'teamcity']
}
