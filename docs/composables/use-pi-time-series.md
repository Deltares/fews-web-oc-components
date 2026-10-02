# usePiTimeSeries

> **Beta** — this API is functional but may change before it is considered stable.

`usePiTimeSeries` fetches one or more FEWS PI time series and exposes reactive response and request state. Use it when a component needs keyed requests, automatic refresh, or request controls without managing a `PiWebserviceProvider` directly.

## Host Setup

By default, requests use the Web Services URL and authorization headers from `provideHostWebserviceContext`. Automatic refresh also defaults to the `onSystemTick` and `onVisibilityResume` policies. The host must provide a system-time signal for `onSystemTick`; see [useHostWebserviceContext](./use-host-webservice-context) and [useHostRefreshContext](./use-host-refresh-context). For standalone use, pass the `webservice` option and configure refresh policies that do not require a host context.

The host and remote must share the same `@deltares/fews-web-oc-composables` Module Federation singleton so the remote can read the host-provided context.

## Example

Each request has a stable, unique key and either a FEWS PI `filter` or a `relativeUrl`. Shared `query` options can supply a time range and response options for all requests:

```ts
import { computed, ref } from 'vue'
import {
  usePiTimeSeries,
  type PiTimeSeriesRequest,
} from '@deltares/fews-web-oc-composables'

const filterId = ref<string | undefined>('example-filter')
const startTime = ref(new Date(Date.now() - 24 * 60 * 60 * 1000))
const endTime = ref(new Date())

const requests = computed<PiTimeSeriesRequest[]>(() =>
  filterId.value
    ? [{ key: 'forecast', filter: { filterId: filterId.value } }]
    : [],
)

const query = computed(() => ({
  startTime: startTime.value,
  endTime: endTime.value,
  thinning: true,
  convertDatum: true,
  useDisplayUnits: true,
}))

const {
  responses,
  errors,
  loading,
  refreshing,
  fetch,
  cancel,
  pauseRefresh,
  resumeRefresh,
} = usePiTimeSeries({ requests, query })

const timeSeries = computed(() => responses.value.forecast?.timeSeries ?? [])
```

Render `timeSeries` in the component's chart or table, and use `loading`, `refreshing`, and `errors.forecast` to show request state. The request key (`forecast`) is the key used in `responses`, `errors`, and `entries`.

## Behavior and Options

- Changes to the reactive `requests` or `query` automatically trigger a fetch. Setting `enabled` to `false` prevents requests and cancels in-flight requests; setting it back to `true` fetches again.
- `responses`, `errors`, and `entries` are keyed by request key. `entries` also includes each request's `loading`, `refreshing`, and `updatedAt` state.
- A previous successful response remains available while its request refreshes. Errors are recorded per key; a failed request does not reject the overall `fetch()` call.
- Identical in-flight requests are shared across composable instances.
- `fetch()` loads immediately, `cancel()` stops this instance's in-flight requests, and `requestRefresh()`, `pauseRefresh()`, and `resumeRefresh()` control coordinated automatic refreshes.
- Refresh defaults are `onSystemTick` and `onVisibilityResume`, with immediate fetching enabled. The default interval is 30 seconds if `onInterval` is included in `refresh.policies`.
- `query` supports `startTime`, `endTime`, `thinning`, `convertDatum`, `useDisplayUnits`, and `onlyHeaders`; options are applied to every request.

See the [usePiTimeSeries API reference](./api/functions/usePiTimeSeries) for full option and return types. For an end-to-end micro-frontend example, see [Micro Frontend Time Series Data](../micro-frontends/load-fews-timeseries-data).
