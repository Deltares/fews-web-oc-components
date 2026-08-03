# useWms

Utilities for loading WMS capabilities, layer time values, and legend graphics.

## Exported APIs

- `useWmsLayerCapabilities(baseUrl, layerName, filter?)`
- `useWmsLegend(baseUrl, layerName, useDisplayUnits, colorScaleRange?, style?)`
- `fetchWmsLegend(baseUrl, layerName, useDisplayUnits, colorScaleRange?, style?)`
- `useWmsCapilities(baseUrl)`

## Example

```ts
import { computed, ref } from 'vue'
import { useWmsLayerCapabilities, useWmsLegend } from '@deltares/fews-web-oc-composables'

const baseUrl = ref('https://example.localhost/data')
const layer = ref('waterlevel')

const { capabilities, layerCapabilities, times } = useWmsLayerCapabilities(baseUrl, layer)

const hasLayer = computed(() => layerCapabilities.value !== undefined)

const legendGraphic = useWmsLegend(
  baseUrl,
  layer,
  true,
  undefined,
  computed(() => layerCapabilities.value?.styles?.[0])
)
```

## Behavior

- APIs reactively reload when input refs change.
- On request failure, relevant refs are reset to `undefined`.
