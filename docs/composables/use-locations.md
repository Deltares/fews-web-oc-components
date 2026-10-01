# useLocations

Fetches FEWS PI locations matching a reactive filter, and keeps them up to date
automatically.

## Exported APIs

- `usePiLocations(options)`

## Example

```ts
import { ref } from 'vue'
import { usePiLocations } from '@deltares/fews-web-oc-composables'

const filter = ref({ filterIds: ['example-filter'] })

const { locations, loading, error, isEmpty } = usePiLocations({ filter })
```

### Standalone usage with custom refresh configuration

```ts
const { locations, requestRefresh, pauseRefresh, resumeRefresh } = usePiLocations({
  filter,
  webservice: { baseUrl: 'https://example.localhost/fewswebservices' },
  refresh: {
    policies: ['onInterval'],
    intervalMs: 30_000,
    immediate: true,
  },
})
```

## Options

| Option            | Type                        | Default                                                 | Description                                                      |
| ------------------ | --------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------ |
| `filter`            | `Ref<PiLocationsFilter>`    | —                                                          | Reactive filter used when fetching locations.                     |
| `enabled`           | `Ref<boolean>`              | `ref(true)`                                               | Controls whether locations may be fetched automatically.          |
| `webservice`        | `PiWebserviceOptions`       | host-provided webservice context                          | Webservice configuration for standalone usage.                    |
| `refresh.policies`  | `RefreshPolicy[]`           | `['onSystemTick', 'onInterval', 'onVisibilityResume']`    | Policies that trigger an automatic refresh.                       |
| `refresh.intervalMs`| `number`                    | `300000` (5 minutes)                                      | Interval between automatic refreshes when `'onInterval'` is used. |
| `refresh.systemTick`| `Ref<Date \| undefined>`    | host-provided system tick                                 | Signal used by the `'onSystemTick'` refresh policy.                |
| `refresh.immediate` | `boolean`                   | `true`                                                     | Whether to fetch immediately when the composable is created.      |

## Behavior

- Reactively refetches when `requestRefresh()` is called, or when an enabled
  refresh policy fires.
- `loading` is `true` only for the first request; subsequent requests set
  `refreshing` instead.
- On request failure, `error` is populated and the previous `geojson`/`locations`
  are preserved.
