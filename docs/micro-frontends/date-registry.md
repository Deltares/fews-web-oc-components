# Date Registry and the Host DateTimeSlider

WebOC and the WebOC dashboard use `createDateRegistry` to collect dates from mounted micro-frontends and provide them to the host [DateTimeSlider](../components/date-time-slider). The registry combines registered date lists into a sorted, de-duplicated `combinedDates` value. The host can use that list to populate the slider and show it only when dates are available.

Create the registry in the host component's `setup()`, above where the micro-frontend is mounted:

```ts
import { ref } from 'vue'
import { createDateRegistry } from '@deltares/fews-web-oc-composables'

const { combinedDates } = createDateRegistry()
const selectedDate = ref<Date>()
```

Bind the collected dates and selected date to the slider. WebOC keeps `selectedDate` synchronized when the user interacts with the component or the dashboard group time slider, then passes the current value to the remote as a prop:

```vue
<DateTimeSlider
  v-if="combinedDates.length > 0"
  v-model:selectedDate="selectedDate"
  :dates="combinedDates"
/>
<MainComponent
  :topologyNode="topologyNode"
  :selectedDate="selectedDate"
/>
```

In the remote component, register a reactive ref or getter containing its available dates. Update the ref when data loads or changes:

```ts
import { ref } from 'vue'
import { useDateRegistry } from '@deltares/fews-web-oc-composables'

const availableDates = ref<Date[]>([])
useDateRegistry(availableDates)

// Set this to the dates available from the component's data.
availableDates.value = responseDates
```

Registered dates are removed automatically when the remote component is disposed. As with the other host composable contexts, the host and remote must share the same `@deltares/fews-web-oc-composables` singleton for the registry to work across the Module Federation boundary.
