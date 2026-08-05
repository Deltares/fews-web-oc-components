# Micro Frontend Components

> [!INFO]
> This document is currently in proposal state. APIs, package names, and implementation details may change before final release.

Micro frontend components are Vue components exposed from the micro-frontends package and mounted by the Web OC host. They should stay small, host-aware, and focused on a single user flow such as showing a map, rendering a time series, or drilling into a location selection.

## Responsibilities

- Receive their context from the host through props.
- Render data and handle local interactions inside the component.
- Emit navigation and data-request events back to the host when the user changes state.
- Use host-provided FEWS settings for authentication and data access.

## Typical Contract

The current micro frontend template exposes a Vue component through module federation and passes state like the active time, selected locations, and geojson data from the host.

```ts
interface Props {
  locationIds?: string
  time: Date
  geojson: FeatureCollection<Geometry, Location>
  topologyNode: TopologyNode
}

interface Emits {
  (event: 'navigate', route: { name: string; params?: { locationIds: string } }): void
  (event: 'getLocations', filter: LocationsFilter): void
}
```

That pattern keeps the micro frontend focused on presentation and interaction while the host remains the source of truth for routing, data loading, and shared session state.

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

When a micro frontend needs FEWS data, pass the FEWS WebServices base URL and auth headers in from the host. The component can then either call `PiWebserviceProvider` directly or use a composable such as `useTimeSeries`.

For a concrete time series example, see [Micro Frontend Time Series Data](./load-fews-timeseries-data).

## Design Notes

- Keep host-specific logic at the boundary and isolate request-building in small helpers.
- Prefer props and emits over shared singletons.
- Make data dependencies explicit so the component can be reused in different host shells.
- Keep the public API narrow and semver-friendly if the component is intended for external consumption.