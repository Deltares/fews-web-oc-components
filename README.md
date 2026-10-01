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

## Releasing

All workspace packages and the root project use one shared version. Set it from the repository root:

```bash
npm run release:set -- 0.3.0-alpha.8
```

This updates the root manifest, all workspace manifests, the lockfile, and internal workspace dependency versions. Commit the changes, then create a GitHub Release for the matching `v<version>` tag (for example, `v0.3.0-alpha.8`). The release workflow checks the tag and all package versions before publishing the components and composables packages to npm. The private micro-frontend is versioned with the monorepo but is not published.

To verify the current release state locally:

```bash
npm run release:check
```

## Documentation with VitePress

Run documentation locally:

```bash
npm run docs:dev
```

Build static documentation:

```bash
npm run docs:build
```

Preview built documentation:

```bash
npm run docs:preview
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
