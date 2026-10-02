# useDateRegistry

> **Beta** — these APIs are functional but may change before they are considered stable.

Use `createDateRegistry` and `useDateRegistry` together to collect available dates from descendant components into a single reactive list. This is useful when a host, such as WebOC, needs to populate a shared [DateTimeSlider](../components/date-time-slider) from dates loaded by one or more micro-frontends.

## Create the Registry in the Host

Call `createDateRegistry` from `setup()` in an ancestor component. It provides a registry to descendants and returns `combinedDates`, a computed list containing the sorted, de-duplicated union of their registered dates:

```ts
import { createDateRegistry } from '@deltares/fews-web-oc-composables'

const { combinedDates } = createDateRegistry()
```

Bind `combinedDates` to the host slider's `dates` prop. Keep the selected date as separate host state; the registry gathers available dates but does not select or synchronize a date by itself.

## Register Dates in a Descendant

Register a `Date[]` ref, computed ref, or getter from a descendant component's setup. The registry tracks updates reactively and unregisters the value when that component or effect scope is disposed:

```ts
import { computed } from 'vue'
import { useDateRegistry } from '@deltares/fews-web-oc-composables'

const availableDates = computed(() =>
  criticalPoints.value.flatMap((point) =>
    point.values.map(({ time }) => new Date(time)),
  ),
)

useDateRegistry(availableDates)
```

Here, `criticalPoints` is the component's normalized time-series data; derive dates from the representation used by your component.

## Requirements and Limits

- Call `createDateRegistry` in an ancestor of the registering component. If no registry is provided, `useDateRegistry` is a no-op.
- The host and remote must share the same `vue` and `@deltares/fews-web-oc-composables` Module Federation singletons so Vue injection can find the provided registry across the remote boundary.
- The registry only combines available dates. The host remains responsible for showing the slider and synchronizing its selected date with the remote.

For the WebOC host and micro-frontend setup, see [Showing the Date Time Slider](../micro-frontends/date-registry). See the [createDateRegistry API](./api/functions/createDateRegistry) and [useDateRegistry API](./api/functions/useDateRegistry) references for full types.
