# Micro Frontend Time Series Data

> [!INFO]
> This document is currently in proposal state. APIs, package names, and implementation details may change before final release.

This guide shows two supported ways for a Web OC micro frontend to load time series data from Delft-FEWS.

In practice, the host application provides the FEWS service URL and authentication context, while the micro frontend is responsible for building the request and mapping the returned series into its own view model.

Supported approaches:

1. Use `PiWebserviceProvider` directly from `@deltares/fews-pi-requests`.
2. Use the `useTimeSeries` composable (intended to be released in `@deltares/fews-web-oc-composables`).

## Prerequisites

A micro frontend loaded by Web OC receives `hostSettings` from the host:

- `baseUrl`: Web OC base path.
- `webservicesUrl`: FEWS WebServices base URL.
- `getHeaders()`: async function that returns authorization headers.

Use these values to build requests that are consistent with the host authentication/session.

If the micro frontend is exposed through module federation, keep the data-loading code inside the component or a small composable so the host only needs to pass these settings and any current selection state.

## Typical Flow

1. The host (FEWS Web OC) mounts the component and passes the current context through props.
2. The component derives a FEWS time series request from those props.
3. The component forwards the host headers to each request.
4. The component renders the returned time series or emits an event when the user changes the selection.

## 1. Load Data with PiWebserviceProvider

Use this approach if you want full control over requests and response mapping.

```ts
import {
  PiWebserviceProvider,
  type TimeSeriesFilter,
} from '@deltares/fews-pi-requests'

interface HostSettings {
  baseUrl: string
  webservicesUrl: string
  getHeaders: () => Promise<Headers>
}

function createProvider(hostSettings: HostSettings): PiWebserviceProvider {
  return new PiWebserviceProvider(hostSettings.webservicesUrl, {
    transformRequestFn: async (request: Request) => {
      const authHeaders = await hostSettings.getHeaders()
      const mergedHeaders = new Headers(request.headers)
      authHeaders.forEach((value, key) => mergedHeaders.set(key, value))

      return new Request(request, {
        headers: mergedHeaders,
      })
    },
  })
}

export async function loadTimeSeriesDirect(
  hostSettings: HostSettings,
  filterId: string,
  startTime: Date,
  endTime: Date,
) {
  const provider = createProvider(hostSettings)

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

> [!INFO]
> We are considering a new major release with API changes to better support batch requests and `AbortController`.

## 2. Load Data with useTimeSeries Composable

Use this approach if you want reactive loading, polling, abort handling, and series mapping out of the box.

### Current import (inside this repository)

```ts
import { computed } from 'vue'
import type { ActionRequest } from '@deltares/fews-pi-requests'
import { useTimeSeries } from '@/services/useTimeSeries'
```

### Intended package import

```ts
import { useTimeSeries } from '@deltares/fews-web-oc-composables'
```

### Example

The example below assumes the micro frontend receives the active filter, selected location IDs, and the FEWS WebServices base URL from its host.

```ts
import { computed, toRef } from 'vue'
import type { ActionRequest } from '@deltares/fews-pi-requests'
import { useTimeSeries } from '@/services/useTimeSeries'

interface Props {
  hostSettings: {
    webservicesUrl: string
  }
  filterId: string
  selectedLocationIds: string[]
}

const props = defineProps<Props>()

const requests = computed<ActionRequest[]>(() => {
  if (!props.filterId || props.selectedLocationIds.length === 0) return []

  return [
    {
      key: 'main',
      request:
        '/timeseries?filterId=' +
        encodeURIComponent(props.filterId) +
        '&locationIds=' +
        props.selectedLocationIds.map(encodeURIComponent).join(',') +
        '&documentFormat=PI_JSON',
    },
  ]
})

const options = computed(() => ({
  startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
  endTime: new Date(),
  thinning: true,
  convertDatum: true,
  useDisplayUnits: true,
}))

const { series, isLoading, loadingSeriesIds, refresh, interval } = useTimeSeries(
  props.hostSettings.webservicesUrl,
  requests,
  options,
  computed(() => requests.value.length > 0),
  undefined,
  true,
)

// Optional: pause polling when hidden, resume when visible.
// interval?.pause()
// interval?.resume()
```

### Notes

- `series` is a reactive map keyed by `ActionRequest.key`.
- Grid time series requests produce indexed keys such as `key[0]`, `key[1]`.
- `refresh()` can be called manually.
- Set the final `refresh` argument to `false` if you only want one load (no polling).
- Use the host selection props to derive the `requests` computed value so the component reloads when the host state changes.

> [!INFO]
> We are currently implementing FEWS system time support and a central method for the data refresh strategy.

## Which Option to Choose?

Use `PiWebserviceProvider` when:

- You need custom endpoints or request/response handling.
- You want complete control over transformation and caching.

Use `useTimeSeries` when:

- You want fast integration with Web OC chart-ready series objects.
- You need built-in reactivity and polling behavior.
- You want consistency with existing Web OC services/composables.

## Packaging Guidance for @deltares/fews-web-oc-composables

To make composables reusable for micro frontends, keep these conventions:

- Keep composables host-agnostic: pass `webservicesUrl` and auth hooks as arguments.
- Keep FEWS PI types (`ActionRequest`, `TimeSeriesFilter`, etc.) in public signatures.
- Avoid hard dependencies on app-level singletons in package code.
- Export composables through a stable barrel file with semver-safe API changes.

This keeps migration from local imports to `@deltares/fews-web-oc-composables` straightforward.

## See Also

- [Micro Frontend Components](./index)
