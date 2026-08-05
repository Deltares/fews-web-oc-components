# Micro Frontend Components

> [!IMPORTANT]
> This document is currently in proposal state. APIs, package names, and implementation details may change before final release.

Micro frontend components are Vue components exposed from the micro-frontends package and mounted by the Web OC host. They should stay small, host-aware, and focused on a single user flow such as showing a map, rendering a time series, or drilling into a location selection.

## Responsibilities

- Receive their context from the host through props.
- Render data and handle local interactions inside the component.
- Emit navigation and data-request events back to the host when the user changes state.
- Use host-provided FEWS settings for authentication and data access.

## Typical Contract

The host mounts the remote component with a small, explicit contract.

```vue
<component
  :selectedDate="selectedDateOfSlider"
  :topologyNode="topologyNode"
  :hostSettings="hostSettings"
  :settings="settings"
  @navigate="onNavigate"
/>
```

```ts
export interface HostSettings {
  baseUrl: string
  webservicesUrl: string
  getHeaders: () => Promise<Headers>
}

interface Props {
  selectedDate: Date
  topologyNode: TopologyNode
  hostSettings: HostSettings
  settings: unknown
}

interface Emits {
  (event: 'navigate', route: unknown): void
}
```

That pattern keeps the micro frontend focused on presentation and interaction while the host remains the source of truth for routing, FEWS connectivity, and shared session state.

## Module Federation

Micro frontend components are exposed from the package entry point so the host can mount them dynamically.

```ts
export default createModuleFederationConfig({
  exposes: {
    './main_component': './src/components/MainComponent.vue'
  }
})
```

## Data Access

When a micro frontend needs FEWS data, use `hostSettings.webservicesUrl` for requests and `hostSettings.getHeaders()` to forward the host authentication headers. The component can then either call `PiWebserviceProvider` directly or use a composable such as `useTimeSeries`.

For a concrete time series example, see [Micro Frontend Time Series Data](./load-fews-timeseries-data).

## Design Notes

- Keep host-specific logic at the boundary and isolate request-building in small helpers.
- Prefer props and emits over shared singletons.
- Keep `settings` typed close to the owning component once its schema stabilizes.
- Make data dependencies explicit so the component can be reused in different host shells.
- Keep the public API narrow and semver-friendly if the component is intended for external consumption.