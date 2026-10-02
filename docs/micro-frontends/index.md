# Micro Frontend Components

> [!IMPORTANT]
> This document is currently in proposal state. APIs, package names, and implementation details may change before final release.

Micro frontend components are Vue components exposed from the micro-frontends package and mounted by the Web OC host. They should stay small, host-aware, and focused on a single user flow such as showing a map, rendering a time series, or drilling into a location selection.

## Demo App

Explore the hosted [FEWS WebOC Micro Frontend Demo](https://deltares.github.io/fews-web-oc-components/micro-frontends/). It runs both remote components with bundled sample data and demonstrates how the host passes props, handles navigation events, and provides shared composable context. When these components are loaded in FEWS WebOC, they use live data from the configured FEWS instance, selected by the Filter ID configured on the topology node.

### D3 World Map: Locations for a FEWS Filter

The Main Panel uses `usePiLocations` to load the FEWS locations selected by the `filterIds` value on its `topologyNode` (the demo uses the `palmiet` filter). It displays the returned GeoJSON on a map and uses host-provided Web Services context. The component accepts `topologyNode`, optional `locationIds`, and optional `selectedDate` props. Selecting a location emits `navigate` with its ID so the host can open the time-series view; the refresh button calls the composable's `fetch`, and the notification button demonstrates `useHostNotifications`.

### Critical Points: River Forecasts

The Critical Points view uses `usePiTimeSeries` to load forecast time series and thresholds for the filter on its `topologyNode` (the demo uses `SWMM Models_Simplified`). It accepts `topologyNode`, `selectedDate`, and optional `locationIds` props; `selectedDate` sets the forecast's current-time reference, and `locationIds` identifies selected rows. Clicking a row emits `navigate` with its location ID for the host to open the time-series window. Search, threshold-category filtering, and manual refresh are handled in the component, while `useDateRegistry` registers available forecast dates with the host DateTimeSlider.

## Responsibilities

- Receive component-specific inputs from the host through props.
- Render data and handle local interactions inside the component.
- Emit the events defined by the component contract, such as navigation; keep route handling in the host.
- Use shared composable context for host-provided FEWS services and refresh state.

## Typical Contract

The host mounts the remote component with the inputs defined by that component's contract. For example, `MainComponent` accepts a `topologyNode` and optional `locationIds` and `selectedDate` values.

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

`topologyNode` is required by `MainComponent`; `locationIds` and `selectedDate` are optional props that the Web OC host passes when available. When opening the time series window, WebOC gets `locationIds` from its router and passes them to the micro frontend. The `selectedDate` prop stays synchronized with the user's date selection: it changes through interactions with the component or through the WebOC dashboard group time slider. `selectedDate` is not required for the locations view. The component derives its location filter and renders the result; the host remains responsible for navigation and shared FEWS connectivity.

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

Micro-frontends can register their available dates with the host so WebOC and the WebOC dashboard can populate and show the DateTimeSlider, and keep its selected date synchronized with the remote. See [Showing the Date Time Slider](./date-registry) for the setup and examples.

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

## FEWS Data Access

When a micro frontend needs FEWS data, prefer the package composables where they cover the use case. For example, `usePiLocations` reads the host webservice context and manages location loading and refreshes, while `usePiTimeSeries` provides keyed reactive time-series requests. Use `PiWebserviceProvider` directly when you need lower-level control.

For the complete composable API reference, see [Composables API](../composables/api/).

For FEWS Web Services documentation, see [Delft-FEWS Documentation](https://fewsdocs.deltares.nl/).

For a concrete time series example, see [Micro Frontend Time Series Data](./load-fews-timeseries-data).

For a location-loading example, see [Micro Frontend Locations](./load-fews-locations).

## Design Notes

- Keep host-specific logic at the boundary and isolate request-building in small helpers.
- Prefer props and emits for component inputs and outputs; use host context providers for shared services.
- Keep component-specific configuration typed at the owning component boundary.
- Make data dependencies explicit so the component can be reused in different host shells.
- Keep the public API narrow and semver-friendly if the component is intended for external consumption.