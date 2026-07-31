# fews-web-oc-components monorepo

## Workspace layout

- `packages/components`: Vue component library package
- `packages/composables`: Shared composables package

## Project setup

Dependency updates and installation are intentionally deferred to the next step.

## Root convenience scripts

These run against the `@deltares/fews-web-oc-components` workspace package.

```bash
npm run dev
npm run serve
npm run build
npm run lint
npm run test
```

## Run scripts directly in a workspace

```bash
npm run -w @deltares/fews-web-oc-components build
npm run -w @deltares/fews-web-oc-composables build
```

## Vite migration target

- Applied: `packages/components` now uses Vite v8 scripts via `rolldown-vite` for dev/build/preview.
- Applied: library outputs are configured through `vite.config.ts` and package exports point to Vite artifacts.
- Follow-up step: install dependencies and run verification (`dev`, `build`, tests) after dependency refresh.
