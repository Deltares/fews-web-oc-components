# usePiLocations

> **Beta** — this API is functional but may change before it is considered stable.

`usePiLocations` fetches FEWS PI locations using a filter and exposes reactive location data and request state. Use it when a component needs automatic refresh or request controls without managing a `PiWebserviceProvider` directly.

## Host Setup

By default, requests use the Web Services URL and authorization headers from `provideHostWebserviceContext`. Automatic refresh defaults to the `onSystemTick`, `onInterval`, and `onVisibilityResume` policies. The host must provide a system-time signal for `onSystemTick`; see [useHostWebserviceContext](./use-host-webservice-context) and [useHostRefreshContext](./use-host-refresh-context). For standalone use, pass the `webservice` option and configure refresh policies that do not require a host context.

The host and remote must share the same `@deltares/fews-web-oc-composables` Module Federation singleton so the remote can read the host-provided context.

## Example

Meaningful changes to the reactive filter automatically clear previous results and fetch matching locations while enabled. Use `fetch()` or `requestRefresh()` to reload locations without changing the filter:

```ts
import { ref } from 'vue'
import { usePiLocations } from '@deltares/fews-web-oc-composables'

const filter = ref({ filterId: 'example-filter' })

const {
  locations,
  geojson,
  loading,
  refreshing,
  error,
  isEmpty,
  fetch,
  requestRefresh,
  pauseRefresh,
  resumeRefresh,
} = usePiLocations({ filter })
```

Render `locations` in a list or `geojson` on a map, and use `loading`, `refreshing`, `error`, and `isEmpty` to show request state.

For standalone usage with custom refresh configuration:

```ts
const { locations, requestRefresh } = usePiLocations({
  filter,
  webservice: { baseUrl: 'https://example.localhost/fewswebservices' },
  refresh: {
    policies: ['onInterval'],
    intervalMs: 30_000,
    immediate: true,
  },
})
```

## Behavior and Options

| Option            | Type                        | Default                                                 | Description                                                      |
| ------------------ | --------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------ |
| `filter`            | `Ref<PiLocationsFilter \| undefined>` | — | Reactive filter used when fetching locations. Meaningful parameter changes clear the current result and fetch automatically while enabled; equivalent replacements are ignored, and `undefined` leaves the result empty without requesting. |
| `enabled`           | `Ref<boolean>`              | `ref(true)`                                               | Controls whether locations may be fetched automatically.          |
| `webservice`        | `PiWebserviceOptions`       | host-provided webservice context                          | Webservice configuration for standalone usage.                    |
| `refresh.policies`  | `RefreshPolicy[]`           | `['onSystemTick', 'onInterval', 'onVisibilityResume']`    | Policies that trigger an automatic refresh.                       |
| `refresh.intervalMs`| `number`                    | `300000` (5 minutes)                                      | Interval between automatic refreshes when `'onInterval'` is used. |
| `refresh.systemTick`| `Ref<Date \| undefined>`    | host-provided system tick                                 | Signal used by the `'onSystemTick'` refresh policy.                |
| `refresh.immediate` | `boolean`                   | `true`                                                     | Whether to fetch immediately when the composable is created.      |

## Behavior

- `hasLoaded` means a successful response is available for the current filter;
  `hasAttempted` also becomes true when the request fails.
- Requests use a snapshot of the current `filter`, with `documentFormat: GEO_JSON` as the default. Meaningful parameter changes cancel pending work, clear previous results and request state, and fetch matching locations while enabled. Stale responses cannot overwrite current data.
- Equivalent filter replacements do not clear results, cancel requests, or trigger refreshes. Comparison ignores object property ordering and treats omitted and `undefined` options as equivalent, but preserves array ordering.
- An `undefined` filter cancels pending work and clears results without fetching.
- Concurrent identical `fetch()` calls within one instance return the same pending promise and make only one provider request. The pending entry is cleared on completion, failure, or cancellation, allowing subsequent requests and retries. Requests are not shared across instances, and completed results are not cached to suppress future requests.
- `enabled` prevents requests while false, including requests caused by filter changes. Automatic refresh triggers are ignored, and `fetch()` does not start a request.
- `loading` is true while fetching without a successful response for the current filter, including retries after an initial failure and requests after a meaningful filter change. Once a successful response is available, later requests for the same filter use `refreshing`. A successful empty response sets `isEmpty` to true.
- A failed request populates `error`, and `fetch()` rejects with the request error. Refresh failures preserve previously loaded `geojson` and `locations`; a meaningful filter change clears those results before requesting new data.
- `fetch()` loads immediately, `cancel()` stops the current request, and `requestRefresh()`, `pauseRefresh()`, and `resumeRefresh()` control coordinated automatic refreshes.
- Explicit fetches and refreshes after completion request data again even when the filter is unchanged. Configured refresh policies do the same, and coordinator triggers during a refresh still queue a follow-up refresh for newer data.
- Refresh defaults are `onSystemTick`, `onInterval`, and `onVisibilityResume`, with immediate fetching enabled. The default interval is 5 minutes.
- `refresh.systemTick` can provide a system-time signal when using `onSystemTick` outside a host context.

See the [usePiLocations API reference](./api/functions/usePiLocations) for full option and return types. For an end-to-end micro-frontend example, see [Load FEWS Locations](../micro-frontends/load-fews-locations).
