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

- Current state: `packages/components` still uses Vue CLI + Webpack scripts.
- Prepared now: a stable `dev` script is available at root and workspace level.
- Follow-up step: replace `packages/components` build and dev scripts with Vite equivalents and update dependencies in one pass.
