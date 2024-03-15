# fews-web-oc-components

## Project Setup

```sh
npm install
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run Component Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
npm run build

# Runs the component tests
npm run test:component
# Runs the tests only on Chromium
npm run test:component -- --project=chromium
# Runs the tests of a specific file
npm run test:component -- example/example.spec.ts
# Runs the tests in debug mode
npm run test:component -- --debug
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

### Format with [Prettier](https://prettier.io/)

```sh
npm run format
```
