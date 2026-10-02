# Micro Frontend Locations

> [!IMPORTANT]
> This document is currently in proposal state. APIs, package names, and implementation details may change before final release.

This guide shows how to load FEWS PI locations in a Web OC micro frontend with `usePiLocations` from `@deltares/fews-web-oc-composables`. The composable handles authenticated requests, reactive location and GeoJSON data, request state, and automatic refresh.

## Host Setup

Before mounting a remote component that uses `usePiLocations`, the host provides the FEWS Web Services URL, authorization headers, and the system-time signal used for refreshes:

```ts
import {
  provideHostRefreshContext,
  provideHostWebserviceContext,
} from '@deltares/fews-web-oc-composables'

provideHostWebserviceContext({
  getBaseUrl: () => webservicesUrl,
  getAuthorizationHeaders: () => getHeaders(),
})

provideHostRefreshContext({ systemTick })
```

`getHeaders()` should return the current authorization headers. Provide the context before mounting the remote. The context is held by the composables package, so configure the host and remote to share the same `@deltares/fews-web-oc-composables` singleton in Module Federation.

The Web OC host owns the service URL, authorization headers, and shared system-time signal. The remote receives component-specific values such as `topologyNode` and `locationIds` as props, derives the FEWS filter, and renders the returned locations. The default location refresh policies include `onSystemTick`, `onInterval`, and `onVisibilityResume`; if the host does not provide a system tick, configure `usePiLocations` with refresh policies that omit `onSystemTick`.

See [Host Context](./index#host-context) for more on sharing host-provided composable context.

## Load Locations

A component can derive a FEWS location filter from its own props. This mirrors `MainComponent`, which uses the first `filterIds` value on `topologyNode` as the request's `filterId`:

```ts
import { computed } from 'vue'
import type { LocationsFilter, TopologyNode } from '@deltares/fews-pi-requests'
import { usePiLocations } from '@deltares/fews-web-oc-composables'

const props = defineProps<{
  topologyNode: TopologyNode
  locationIds?: string
}>()

const filter = computed<LocationsFilter>(() => {
  const filterId = props.topologyNode.filterIds?.[0]
  return filterId ? { filterId } : {}
})

const {
  locations,
  geojson,
  loading,
  refreshing,
  error,
  isEmpty,
  fetch,
  cancel,
  requestRefresh,
  pauseRefresh,
  resumeRefresh,
} = usePiLocations({ filter })
```

`usePiLocations` fetches immediately by default. `locations` contains the normalized location records, and `geojson` contains the returned feature collection for a map. For example, a list can render location IDs while exposing the loading, error, and empty states:

```vue
<template>
  <p v-if="loading">Loading locations...</p>
  <p v-else-if="error">Could not load locations: {{ error.message }}</p>
  <p v-else-if="isEmpty">No locations found.</p>
  <ul v-else>
    <li v-for="location in locations" :key="location.locationId">
      {{ location.locationId }}
    </li>
  </ul>
  <p v-if="refreshing">Updating locations...</p>
</template>
```

`locationIds` is a component selection used to highlight locations in a view; it is not the filter used to fetch them. If a selected location should narrow the FEWS request, include it explicitly in the `filter` according to the FEWS PI filter API.

## Filter Changes and Refresh

The composable reads `filter.value` when a request starts; changing the filter alone does not trigger a new request. Call `fetch()` after changing the filter when the new selection should load immediately. `fetch()` rejects if the request fails, while the composable also exposes the failure through `error`.

Automatic refresh is enabled by default with these policies:

- `onSystemTick`: refresh when the host system-time signal changes.
- `onInterval`: refresh every five minutes.
- `onVisibilityResume`: refresh when the page becomes visible again.

Use the returned controls when the component needs to manage refresh behavior:

- `fetch()` loads locations immediately using the current filter.
- `requestRefresh()` requests a refresh through the refresh coordinator.
- `cancel()` cancels the active request.
- `pauseRefresh()` and `resumeRefresh()` control automatic refreshes.

For a manual-only component, disable automatic policies and decide when to fetch:

```ts
const locationsState = usePiLocations({
  filter,
  refresh: {
    policies: [],
    immediate: false,
  },
})

// Call locationsState.fetch() when the user requests locations.
```

## See Also

- [Micro Frontend Components](./index)
- [useLocations API](../composables/use-locations)
- [Loading Time Series](./load-fews-timeseries-data)
