<template>
  <div id="legend">
    <svg id="colourbar" class="colourbar" data-testid="colourbar">
      <g
        ref="group"
        transform="translate(25, 25)"
        style="pointer-events: visiblePainted"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, useTemplateRef, watchEffect } from 'vue'
import {
  ColourBar,
  type ColourMap,
  type ColourBarOptions,
  AxisPosition,
} from '@deltares/fews-web-oc-charts'

export interface Props {
  colourMap?: ColourMap
  options?: Partial<ColourBarOptions>
  width?: number
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: 250,
  height: 10,
})

const group = useTemplateRef('group')
const colourbarWidth = computed(() => `${props.width + 50}px`)
const colourbarHeight = computed(() => `${props.height + 50}px`)

watchEffect(updateColourBar)
function updateColourBar() {
  if (!props.colourMap || !group.value) return

  // Remove possible previous colour map.
  group.value.innerHTML = ''

  // Create new colour bar and make it visible.
  const options: ColourBarOptions = {
    type: 'nonlinear',
    useGradients: true,
    position: AxisPosition.Bottom,
    ...props.options,
  }

  new ColourBar( // NOSONAR(S1848) - creates DOM element on group.value element
    group.value,
    props.colourMap,
    props.width,
    props.height,
    options,
  )
}
</script>

<style scoped>
.colourbar {
  width: v-bind(colourbarWidth);
  height: v-bind(colourbarHeight);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.colourbar :deep(.axis .tick line) {
  filter: drop-shadow(0px 0px 1px rgb(var(--v-theme-background)))
    drop-shadow(0px 0px 1px rgb(var(--v-theme-background)))
    drop-shadow(0px 0px 1px rgb(var(--v-theme-background)));
}

:deep(g) {
  pointer-events: none;
  font-family: var(--primary-font);
}

:deep(text) {
  text-rendering: optimizeLegibility;
  text-shadow:
    rgb(var(--v-theme-background)) 0px 0px 2px,
    rgb(var(--v-theme-background)) 0px 0px 2px,
    rgb(var(--v-theme-background)) 0px 0px 2px;
}

:deep(svg text) {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  font-size: 1em;
}
</style>
