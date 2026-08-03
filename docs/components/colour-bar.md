# ColourBar

Visual legend component for value-to-color mapping.

## Basic Usage

```vue
<script setup lang="ts">
import { ColourBar } from '@deltares/fews-web-oc-components'

const ticks = [0, 10, 20, 30, 40]
const colors = ['#2c7bb6', '#abd9e9', '#ffffbf', '#fdae61', '#d7191c']
</script>

<template>
  <ColourBar
    :ticks="ticks"
    :colors="colors"
    unit="m"
  />
</template>
```
