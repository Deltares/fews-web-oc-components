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

`selectedDate` is optional in `MainComponent`; the host does not need to provide it for the locations view. The host remains the source of truth for routing and FEWS connectivity, while composable providers make shared service context available without passing it through every component's props.

## Host Context

Before loading a micro frontend that makes FEWS requests, the host provides its Web Services URL and authentication-header function. Refresh and notification contexts can be provided the same way when needed.

```ts
import { provideHostWebserviceContext } from '@deltares/fews-web-oc-composables'

provideHostWebserviceContext({
  getBaseUrl: () => webservicesUrl,
  getAuthorizationHeaders: () => getHeaders(),
})
```

Data composables such as `usePiLocations` use this context by default. The host must provide the context before mounting a remote that uses it. Because the context is held by the composables package, configure both host and remote to share the same `@deltares/fews-web-oc-composables` singleton; otherwise the remote may not see the host's provided context.

## Module Federation

The remote exposes its component under a module-federation key. For example, this repository exposes the component source directly as `./main_component`:

```ts
export default createModuleFederationConfig({
  exposes: {
    './main_component': './src/components/MainComponent.vue'
  }
})
```

## Data Access

When a micro frontend needs FEWS data, prefer the package composables where they cover the use case. For example, `usePiLocations` reads the host webservice context and manages location loading and refreshes, while `usePiTimeSeries` provides keyed reactive time-series requests. Use `PiWebserviceProvider` directly when you need lower-level control.

For a concrete time series example, see [Micro Frontend Time Series Data](./load-fews-timeseries-data).

## Design Notes

- Keep host-specific logic at the boundary and isolate request-building in small helpers.
- Prefer props and emits for component inputs and outputs; use host context providers for shared services.
- Keep component-specific configuration typed at the owning component boundary; avoid catch-all props such as `settings` on `MainComponent`.
- Make data dependencies explicit so the component can be reused in different host shells.
- Keep the public API narrow and semver-friendly if the component is intended for external consumption.