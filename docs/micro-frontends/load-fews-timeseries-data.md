# Micro Frontend Time Series Data

> [!IMPORTANT]
> This document is currently in proposal state. APIs, package names, and implementation details may change before final release.

This guide shows how a Web OC micro frontend can load time series data from Delft-FEWS using `usePiTimeSeries`, or use `PiWebserviceProvider` directly for lower-level control.

The Web OC host owns FEWS connectivity: it provides the Web Services URL and authorization headers through composable context. The micro frontend owns its time-series filters, query options, and presentation. Service URLs and credentials are not component props.

## Prerequisites

A component receives the inputs it needs for its own view. For example, `MainComponent` accepts a `topologyNode`, optional `locationIds`, and optional `selectedDate`. For another remote, the host passes that component's declared selection props. Provide the shared FEWS service context in the host before mounting the remote component:

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

`provideHostRefreshContext` supplies the host's system-time signal. It is needed when the composable uses the default `onSystemTick` refresh policy; if the host does not provide it, configure `usePiTimeSeries` with refresh policies that omit `onSystemTick`.

The webservice context is stored by the composables package. Configure both host and remote to share the same `@deltares/fews-web-oc-composables` singleton in Module Federation, or the remote may read a different module instance and fail to see the provided context.

## Typical Flow

1. The host provides Web Services URL and authentication via `provideHostWebserviceContext`, plus a system-time signal if the selected refresh policy needs it.
2. The component derives keyed FEWS time-series requests from its declared props or local state; the host does not construct the request for it.
3. `usePiTimeSeries` sends requests with the host-provided authentication headers and manages reactive response and loading state.
4. The component renders the responses or emits an event when the user changes the selection.

## 1. Load Data with PiWebserviceProvider

> [!INFO]
> `usePiTimeSeries` is the recommended option for reactive, keyed requests. Use the provider directly when you need to control request execution and response handling yourself.

Use this approach if you want full control over requests and response mapping.

```ts
import { PiWebserviceProvider, type TimeSeriesFilter } from '@deltares/fews-pi-requests'
import { useHostWebserviceContext } from '@deltares/fews-web-oc-composables'

function createProvider(): PiWebserviceProvider {
  const { getBaseUrl, getAuthorizationHeaders } = useHostWebserviceContext()

  return new PiWebserviceProvider(getBaseUrl(), {
    transformRequestFn: async (request: Request) => {
      const authHeaders = await getAuthorizationHeaders()
      const mergedHeaders = new Headers(request.headers)
      authHeaders.forEach((value, key) => mergedHeaders.set(key, value))

      return new Request(request, {
        headers: mergedHeaders,
      })
    },
  })
}

export async function loadTimeSeriesDirect(
  filterId: string,
  startTime: Date,
  endTime: Date,
) {
  const provider = createProvider()

  const filter: TimeSeriesFilter = {
    filterId,
    startTime,
    endTime,
    useDisplayUnits: true,
    convertDatum: true,
  }

  const response = await provider.getTimeSeries(filter)
  return response.timeSeries ?? []
}
```

### Notes

- This is the most flexible option for custom request building.
- You are responsible for mapping FEWS PI response objects to your chart/table model.
- Reuse one provider instance per component where possible.


## 2. Load Data with usePiTimeSeries

Use `usePiTimeSeries` for reactive, keyed requests, request cancellation, shared in-flight request handling, and configurable automatic refresh.

```ts
import { computed, ref } from 'vue'
import { usePiTimeSeries } from '@deltares/fews-web-oc-composables'
```

### Example

Build a stable key for each request. `relativeUrl` is resolved against the host-provided Web Services base URL; `query` options are applied to each request. This example uses local date-range state and can be adapted to the owning component's actual inputs.

```ts
const filterId = ref('example-filter')
const startTime = ref(new Date(Date.now() - 24 * 60 * 60 * 1000))
const endTime = ref(new Date())

const requests = computed(() =>
  filterId.value
    ? [{ key: 'main', filter: { filterId: filterId.value } }]
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
  loading,
  refreshing,
  errors,
  entries,
  fetch,
  cancel,
  pauseRefresh,
  resumeRefresh,
} = usePiTimeSeries({ requests, query })

const mainTimeSeries = computed(() => responses.value.main?.timeSeries ?? [])
```

### Notes

- `responses` and `errors` are reactive objects keyed by the request key, such as `main`.
- Each request in `entries` contains its response, loading/refreshing state, error, and last update time. `mainTimeSeries` shows one way to read the response for the `main` key.
- `fetch()` loads requests immediately; `cancel()` cancels requests from this composable instance.
- Automatic refresh defaults to host system ticks and visibility resume. Configure `refresh.policies`, `refresh.intervalMs`, or `refresh.immediate` as needed.
- Derive `requests` and `query` reactively so changes to the selected filter or time range trigger a new load.


## Which Option to Choose?

Use `PiWebserviceProvider` directly when:

- You need custom endpoints or request/response handling.
- You want complete control over transformation and caching.

Use `usePiTimeSeries` when:

- You want keyed reactive responses and per-request loading/error state.
- You need built-in request cancellation and configurable refresh behavior.
- You want requests to use host-provided service and authentication context without prop-drilling it.

## Packaging Guidance for @deltares/fews-web-oc-composables

The host context is shared by composables such as `usePiTimeSeries`; component-specific selections remain regular props or local reactive state.

## See Also

- [Micro Frontend Components](./index)
- [usePiTimeSeries](../composables/use-pi-time-series)
- [useRefreshCoordinator](../composables/use-refresh-coordinator)
- [useHostWebserviceContext](../composables/use-host-webservice-context)
- [useHostRefreshContext](../composables/use-host-refresh-context)
- [Loading Locations](./load-fews-locations)
