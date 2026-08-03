# DateTimeSlider

Interactive timeline component to browse and select date/time values.

## Basic Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { DateTimeSlider } from '@deltares/fews-web-oc-components'

const selectedDate = ref(new Date())
const availableDates = [
  new Date('2026-08-01T00:00:00Z'),
  new Date('2026-08-01T06:00:00Z'),
  new Date('2026-08-01T12:00:00Z'),
  new Date('2026-08-01T18:00:00Z')
]
</script>

<template>
  <DateTimeSlider
    v-model="selectedDate"
    :dates="availableDates"
  />
</template>
```

## Notes

- Keep dates as JavaScript `Date` objects.
- Ensure dates are sorted chronologically before passing to the component.
