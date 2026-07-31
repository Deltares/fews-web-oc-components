<template>
  <div class="datetime-slider">
    <div class="slider-container">
      <v-slider
        v-model="dateIndex"
        :ticks="marks"
        :step="1"
        :max="maxIndex"
        hide-details
        show-ticks="always"
        :tick-size="tickSize"
        thumb-label
        density="compact"
        :color="colors?.primary"
        @update:model-value="stopFollowNow"
      >
        <template #tick-label="{ tick }">
          <v-chip label variant="elevated" density="comfortable" class="px-2">
            {{ tick.label }}
          </v-chip>
        </template>
        <template #thumb-label>
          {{ dates[dateIndex]?.toLocaleString() ?? '' }}
        </template>
      </v-slider>
    </div>
    <div class="datetime-slider__actions">
      <slot name="prepend"></slot>
      <div class="now-tracking-control">
        <v-btn
          density="compact"
          variant="text"
          :icon="nowButtonIcon"
          :color="nowButtonColor"
          @click="toggleFollowNow"
        />
        <span class="datetime-slider__datefield">{{ dateString }}</span>
      </div>
      <v-spacer />
      <div class="play-controls">
        <v-menu
          v-if="speedControl !== false"
          offset="25"
          transition="fade-transition"
        >
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              density="compact"
              variant="text"
              icon
              :color="colors?.primary"
            >
              <v-icon>mdi-play-speed</v-icon>
              <v-tooltip location="top" activator="parent">
                <span>Playback speed</span>
              </v-tooltip>
            </v-btn>
          </template>

          <v-list class="pa-1">
            <v-list-item
              v-for="speed in availableSpeeds"
              :key="speed"
              :active="speed === currentSpeed"
              rounded
              density="compact"
              @click="setSpeed(speed)"
              :title="formatSpeed(speed)"
            />
          </v-list>
        </v-menu>
        <v-btn
          density="compact"
          variant="text"
          icon="mdi-skip-previous"
          @mousedown="stepBackward"
          @mouseup="stopPlay"
          :color="colors?.primary"
        />
        <v-btn
          density="compact"
          variant="text"
          :icon="playButtonIcon"
          :color="playButtonColor"
          @click="togglePlay"
        />
        <v-btn
          density="compact"
          variant="text"
          icon="mdi-skip-next"
          @mousedown="stepForward"
          @mouseup="stopPlay"
          :color="colors?.primary"
        />
      </div>
      <slot name="append"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { scaleTime } from 'd3'
import {
  VSlider,
  VBtn,
  VMenu,
  VList,
  VListItem,
  VSpacer,
  VChip,
  VIcon,
  VTooltip,
} from 'vuetify/components'

import { findClosestIndex } from '@/utils/findClosestIndex'
import { formatDate } from '@/utils/formatDate'

interface Colors {
  primary: string
  accent: string
}

export interface Props {
  selectedDate?: Date
  dates: Date[]
  isLoading?: boolean
  doFollowNow?: boolean
  playInterval?: number
  followNowInterval?: number
  dateFormatter?: (date: Date) => string
  dateComparator?: (a: Date, b: Date) => number
  tickDateFormatter?: (date: Date) => string
  colors?: Colors
  tickSize?: number
  speedControl?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  doFollowNow: true,
  playInterval: 1000,
  followNowInterval: 60000,
  dateFormatter: (date: Date) => date.toLocaleString(),
  dateComparator: (a: Date, b: Date) => a.getTime() - b.getTime(),
  tickSize: 8,
})
const emit = defineEmits(['update:selectedDate', 'update:doFollowNow'])

// Step size when playing an animation, and when clicking the previous and next frame buttons.
const playIncrement = 1
const stepIncrement = 1
const dateIndex = ref(0)

const defaultSpeed = 1
const currentSpeed = ref(defaultSpeed)
const availableSpeeds = [0.5, 1, 2, 4]

const playTimeoutTimer = ref<ReturnType<typeof setTimeout>>()

const doFollowNow = ref(props.doFollowNow)
let followNowIntervalTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  if (props.doFollowNow) {
    startFollowNow()
  }
})

const marks = computed(() => {
  const dayMarks: Record<number, string> = {}
  const dateScale = scaleTime().domain(props.dates)
  const ticks = dateScale.ticks(5)
  const formattedTicks = ticks.map(props.tickDateFormatter ?? formatDate)

  let tickIndex = 0
  props.dates.forEach((date, i) => {
    if (
      tickIndex < ticks.length &&
      date.getTime() >= ticks[tickIndex].getTime()
    ) {
      dayMarks[i] = formattedTicks[tickIndex]
      tickIndex++
    }
  })

  return dayMarks
})

// Synchronise selectedDate property and local index variable.
watch(dateIndex, (index) => {
  emit('update:selectedDate', props.dates[index])
})

watch(
  () => props.selectedDate,
  (selectedDate) => {
    if (selectedDate === undefined) return
    let index = findClosestIndex(
      props.dates,
      selectedDate,
      props.dateComparator,
    )
    if (index === dateIndex.value) return
    dateIndex.value = index
  },
  { immediate: true },
)

// Synchronise doFollowNow property and local variable.
watch(doFollowNow, (doFollowNow) => {
  emit('update:doFollowNow', doFollowNow)
})

watch(
  () => props.doFollowNow,
  (doFollowNowProp) => {
    doFollowNow.value = doFollowNowProp
  },
)

// When the input dates change, make sure the selected index is updated to point to the correct
// member of the new dates array.
watch(
  () => props.dates,
  () => {
    if (doFollowNow.value) {
      setDateToNow()
      if (
        props.selectedDate?.getTime() !==
        props.dates[dateIndex.value]?.getTime()
      ) {
        emit('update:selectedDate', props.dates[dateIndex.value])
      }
    } else if (props.selectedDate) {
      const oldDate = props.selectedDate
      dateIndex.value = findClosestIndex(
        props.dates,
        oldDate,
        props.dateComparator,
      )
    }
  },
)

const maxIndex = computed(() => {
  if (props.dates === undefined) {
    return 0
  }
  return Math.max(props.dates.length - 1, 0)
})

// Now and play button styling is dependent on properties.
const nowButtonIcon = computed(() =>
  props.isLoading ? 'mdi-loading mdi-spin' : 'mdi-clock',
)
const playButtonIcon = computed(() =>
  playTimeoutTimer.value ? 'mdi-pause' : 'mdi-play',
)
const nowButtonColor = computed(() =>
  doFollowNow.value ? props.colors?.accent : props.colors?.primary,
)
const playButtonColor = computed(() =>
  playTimeoutTimer.value ? props.colors?.accent : props.colors?.primary,
)

const dateString = computed(() =>
  props.dates[dateIndex.value]
    ? props.dateFormatter(props.dates[dateIndex.value])
    : '',
)

function toggleFollowNow(): void {
  doFollowNow.value = !doFollowNow.value
  if (doFollowNow.value) {
    startFollowNow()
  } else {
    stopFollowNow()
  }
}

function startFollowNow(): void {
  doFollowNow.value = true
  stopPlay()
  setDateToNow()
  followNowIntervalTimer = setInterval(setDateToNow, props.followNowInterval)
}

function stopFollowNow(): void {
  doFollowNow.value = false
  if (followNowIntervalTimer) clearInterval(followNowIntervalTimer)
  followNowIntervalTimer = null
}

function setDateToNow(): void {
  const now = new Date()
  dateIndex.value = findClosestIndex(props.dates, now, props.dateComparator)
}

function togglePlay(): void {
  if (playTimeoutTimer.value) {
    stopPlay()
  } else {
    startPlay()
  }
}

function startPlay(): void {
  stopFollowNow()
  play()
}

function stopPlay(): void {
  if (playTimeoutTimer.value) {
    clearTimeout(playTimeoutTimer.value)
    playTimeoutTimer.value = undefined
  }
}

function play(): void {
  if (dateIndex.value === maxIndex.value) {
    dateIndex.value = 0
  } else {
    increment(playIncrement)
  }
  playTimeoutTimer.value = setTimeout(
    play,
    props.playInterval * (1 / currentSpeed.value),
  )
}

function stepBackward(): void {
  stopFollowNow()
  decrement(stepIncrement)
}

function stepForward(): void {
  stopFollowNow()
  increment(stepIncrement)
}

function decrement(step: number): void {
  dateIndex.value = Math.max(dateIndex.value - step, 0)
}

function increment(step: number): void {
  dateIndex.value = Math.min(dateIndex.value + step, maxIndex.value)
}

function setSpeed(speed: number) {
  currentSpeed.value = speed
}

function formatSpeed(speed: number) {
  return speed === defaultSpeed ? 'Normal' : `${speed}x`
}
</script>

<style scoped>
.slider-container {
  padding: 0px 10px;
}

.datetime-slider__actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px 10px 6px;
}

.datetime-slider__datefield {
  margin: auto;
  width: 24ch;
  flex: 2 0 20%;
}

.now-tracking-control {
  display: flex;
  flex-direction: row;
  gap: 15px;
}

.play-controls {
  display: flex;
  flex-direction: row;
  gap: 10px;
}

:deep(.v-slider-thumb__label) {
  width: max-content;
}

:deep(.v-slider-track__tick-label) {
  transform: translate(
    calc(-50% + var(--v-slider-tick-size) / 4),
    calc(-100% - var(--v-slider-tick-size) - 1rem)
  ) !important;
  display: none;
}

/* Display label if a succeeding tick is hovered */
:deep(div:has(~ .v-slider-track__tick:hover) > .v-slider-track__tick-label),
/* Display label if a preceding tick is hovered */
:deep(.v-slider-track__tick:hover ~ div > .v-slider-track__tick-label),
/* Display label if the tick itself is hovered */
:deep(.v-slider-track__tick:hover > .v-slider-track__tick-label) {
  display: block;
}
</style>
