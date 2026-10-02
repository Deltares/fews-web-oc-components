# Micro Frontend Components

> [!IMPORTANT]
> This document is currently in proposal state. APIs, package names, and implementation details may change before final release.

Micro frontend components are Vue components exposed from the micro-frontends package and mounted by the Web OC host. They should stay small, host-aware, and focused on a single user flow such as showing a map, rendering a time series, or drilling into a location selection.

## Responsibilities

- Receive component-specific inputs from the host through props.
- Render data and handle local interactions inside the component.
- Emit the events defined by the component contract, such as navigation; keep route handling in the host.
- Use shared composable context for host-provided FEWS services and refresh state.

## Typical Contract

The host mounts the remote component with only the inputs that belong to that component. For example, `MainComponent` accepts a topology node and an optional location selection; it does not take `hostSettings` or a general-purpose `settings` prop.

```vue
<MainComponent
  :topologyNode="topologyNode"
  :locationIds="locationIds"
  @navigate="onNavigate"
/>
```

```ts
import type { TopologyNode } from '@deltares/fews-pi-requests'

interface Props {
  topologyNode: TopologyNode
  locationIds?: string
  selectedDate?: Date
}

interface NavigationRoute {
  name: string
  params?: {
    locationIds: string
  }
}

interface Emits {
  (event: 'navigate', route: NavigationRoute): void
}
```

`topologyNode` is required by `MainComponent`; `locationIds` and `selectedDate` are optional props that the Web OC host passes only when it has those values. `selectedDate` is not required for the locations view. The component derives its location filter and renders the result; the host remains responsible for navigation and shared FEWS connectivity.

## What the Web OC Host Provides

The Web OC host provides two kinds of input:

- Component props, such as `topologyNode` and optional selections. Their names and types are defined by each remote component.
- Shared service context, such as the FEWS Web Services URL and authorization headers. This is provided once by the host, not passed through component props.

Before mounting a remote that makes FEWS requests, the host provides its Web Services URL and authentication-header function:

```ts
import { provideHostWebserviceContext } from '@deltares/fews-web-oc-composables'

provideHostWebserviceContext({
  getBaseUrl: () => webservicesUrl,
  getAuthorizationHeaders: () => getHeaders(),
})
```

Data composables such as `usePiLocations` use this context by default. If a component uses host-driven refresh or notifications, the host must also provide those contexts before mounting it. Because these contexts are held by the composables package, configure both host and remote to share the same `@deltares/fews-web-oc-composables` singleton; otherwise the remote may not see the host's provided context.

## Module Federation

See [Module Federation](https://module-federation.io/) for an overview. The remote exposes its component under a module-federation key. For example, this repository exposes the component source directly as `./main_component`:

For standalone sample-data development and WebOC integration setups, see [Micro-Frontend Development Setup](./development).

For deployment instructions, see [Deploying Micro Frontends | fews-web-oc](https://deltares.github.io/fews-web-oc/micro_frontends/).

```ts
export default createModuleFederationConfig({
  exposes: {
    './main_component': './src/components/MainComponent.vue'
  }
})
```

To register a remote and reference it from FEWS topology, see [Configure a Micro Frontend in FEWS](./configure-in-fews).

## Data Access

When a micro frontend needs FEWS data, prefer the package composables where they cover the use case. For example, `usePiLocations` reads the host webservice context and manages location loading and refreshes, while `usePiTimeSeries` provides keyed reactive time-series requests. Use `PiWebserviceProvider` directly when you need lower-level control.

For a concrete time series example, see [Micro Frontend Time Series Data](./load-fews-timeseries-data).

For a location-loading example, see [Micro Frontend Locations](./load-fews-locations).

## Design Notes

- Keep host-specific logic at the boundary and isolate request-building in small helpers.
- Prefer props and emits for component inputs and outputs; use host context providers for shared services.
- Keep component-specific configuration typed at the owning component boundary; avoid catch-all props such as `settings` on `MainComponent`.
- Make data dependencies explicit so the component can be reused in different host shells.
- Keep the public API narrow and semver-friendly if the component is intended for external consumption.