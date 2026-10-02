# useRefreshCoordinator

> **Beta** — this API is functional but may change before it is considered stable.

Use `useRefreshCoordinator` to run a custom data-loading callback in response to shared system ticks, an interval, document visibility changes, or explicit manual triggers. The data composables `usePiLocations` and `usePiTimeSeries` already use refresh coordination internally; use this directly when implementing a custom data source or refresh flow.

## Example

Call the composable from component setup. This example refreshes when the page becomes visible and every 30 seconds:

```ts
import { ref } from 'vue'
import { useRefreshCoordinator } from '@deltares/fews-web-oc-composables'

const enabled = ref(true)

async function refreshData() {
  await loadCustomData()
}

const coordinator = useRefreshCoordinator(refreshData, {
  policies: ['onInterval', 'onVisibilityResume'],
  intervalMs: 30_000,
  immediateCallback: true,
  enabled,
})
```

A manual refresh can use `coordinator.trigger()`. Pause and resume automatic refreshes with `coordinator.pause()` and `coordinator.resume()`. The coordinator is automatically paused when its effect scope is disposed.

## Policies and Options

- `policies` is required and controls automatic triggers. `onSystemTick` responds to changes in a host-provided or explicitly supplied `systemTick`; it requires a system tick. See [useHostRefreshContext](./use-host-refresh-context).
- `onInterval` starts a timer only when included in `policies`. `intervalMs` defaults to 1,000 milliseconds, so set it explicitly to an interval suitable for the data source.
- `onVisibilityResume` triggers when the document becomes visible. Triggers are ignored while the document is hidden when this policy is enabled.
- `immediateCallback` defaults to `false`; set it to `true` to run the callback when the coordinator is created.
- `enabled` is a `Ref<boolean>` that gates all triggers and defaults to `true`.
- `trigger()` runs the callback manually, even when `manual` is not in `policies`. A trigger during an active callback queues one follow-up run; multiple overlapping triggers are coalesced.

The returned coordinator also exposes `isActive`, `lastRefreshAt`, and `lastTriggerPolicy`. See the [useRefreshCoordinator API reference](./api/functions/useRefreshCoordinator) for full types.
