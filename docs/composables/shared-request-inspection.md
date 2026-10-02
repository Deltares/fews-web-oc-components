# Shared Request Inspection

> **Alpha** — these APIs may be incomplete or not fully functional, and may change.

> **Development-only** — These helpers are intended only for development diagnostics and are expected to remain alpha for the foreseeable future.

Use the shared-request inspection APIs to build diagnostics or monitoring views for requests currently being deduplicated by `sharedRequest`. They are not a general network monitor: settled requests and requests that do not use `sharedRequest` are not included.


## Reactive Inspection in a Component

`useSharedRequestRegistrations` returns a read-only reactive list and unsubscribes automatically when the current component or effect scope is disposed:

```ts
import { computed } from 'vue'
import { useSharedRequestRegistrations } from '@deltares/fews-web-oc-composables'

const registrations = useSharedRequestRegistrations()
const activeRequestCount = computed(() => registrations.value.length)
const attachedCallerCount = computed(() =>
  registrations.value.reduce(
    (total, registration) => total + registration.subscriberCount,
    0,
  ),
)
```

Each registration contains a `key`, `subscriberCount`, and `startedAt` timestamp. Keys are typically request URLs and may contain sensitive query parameters or tokens. Sanitize keys before displaying or logging them; prefer showing aggregate counts when raw request details are not needed.

## Low-Level Inspection

Use `getSharedRequestRegistrations()` for a one-time snapshot, or subscribe to updates with `subscribeSharedRequestRegistrations()`. The subscriber is called immediately with the current snapshot and whenever registrations change; retain and call the returned unsubscribe function when finished.

These helpers are intended for diagnostics and operational views. See the [useSharedRequestRegistrations API](./api/functions/useSharedRequestRegistrations), [getSharedRequestRegistrations API](./api/functions/getSharedRequestRegistrations), and [subscribeSharedRequestRegistrations API](./api/functions/subscribeSharedRequestRegistrations) references for details.
