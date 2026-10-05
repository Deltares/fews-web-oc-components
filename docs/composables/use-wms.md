# useWms

> **Alpha** — this API is not yet fully functional; in particular, it does not yet support refresh coordination through `useRefreshCoordinator` or the host-provided `useHostRefreshContext`.

Utilities for loading WMS capabilities, layer time values, and legend graphics.

## Exported APIs

- `useWmsLayerCapabilities(options)`
- `useWmsLegend(options)`
- `fetchWmsLegend(options)`
- `useWmsCapabilities(options)`

Default refresh policies differ by composable: `useWmsLayerCapabilities` refreshes on system-time ticks and visibility resume; `useWmsLegend` and `useWmsCapabilities` have no scheduled policies by default. All perform the initial fetch by default.

## Example

```ts
import { computed, ref } from 'vue'
import { useWmsLayerCapabilities, useWmsLegend } from '@deltares/fews-web-oc-composables'

const enabled = ref(true)
const options = {
  layerName: ref('waterlevel'),
  enabled,
  webservice: { baseUrl: 'https://example.localhost/fewswebservices' },
  refresh: {
    policies: ['onInterval'],
    intervalMs: 30_000,
  },
}

const { capabilities, layerCapabilities, times, loading, error } =
  useWmsLayerCapabilities(options)

const hasLayer = computed(() => layerCapabilities.value !== undefined)

const { legendGraphic } = useWmsLegend({
  ...options,
  useDisplayUnits: true,
  style: computed(() => layerCapabilities.value?.styles?.[0]),
})
```

## Behavior

- Layer capabilities and legends reload when their reactive options change.
- All composables accept `enabled`, `webservice`, and `refresh` options.
- Scheduled refresh defaults are component-specific; legend/layer option changes remain reactive.
- Request state includes `loading`, `refreshing`, `error`, and `hasLoaded`.
- Automatic refresh can be triggered, paused, and resumed through the returned controls.
- A failed request is exposed through `error`; full capabilities and legend responses retain their last successful values, while the layer-specific capabilities composable clears its data.
