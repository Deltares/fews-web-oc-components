<template>
  <v-sheet class="time-slider-container" :class="floatingClass">
    <v-slider
      v-model="index"
      :max="max"
      step="1"
      tick-size="6"
      tabindex="0"
      @update:modelValue="onInput"
      hide-details
      height="0"
    />
    <div class="d-flex flex-row flex-grow-1 px-4 py-1">
      <slot name="prepend" />
      <v-divider vertical />
      <div class="d-flex flex-grow-1 justify-space-between">
        <div class="d-flex align-center">
          <v-btn icon :color="nowColor" @click="toggleNow">
            <v-icon v-if="loading">mdi-loading mdi-spin</v-icon>
            <v-icon v-else>mdi-clock</v-icon>
          </v-btn>
          <span class="text-body-2 mx-auto" style="width: 30ch">
            {{ dateString }}
          </span>
        </div>
        <div class="d-flex">
          <v-btn icon ref="BackButton" @mousedown="backward()" @mouseup="stopPlay">
            <v-icon>mdi-skip-previous</v-icon>
          </v-btn>
          <v-btn icon :color="playColor" ref="PlayButton" @click="togglePlay">
            <v-icon>{{ isPlaying ? 'mdi-pause' : 'mdi-play' }}</v-icon>
          </v-btn>
          <v-btn icon ref="ForwardButton" @mousedown="forward()" @mouseup="stopPlay">
            <v-icon>mdi-skip-next</v-icon>
          </v-btn>
          <slot name="append" />
        </div>
      </div>
    </div>
  </v-sheet>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

export interface Props {
  dates?: Date[]
  loading?: boolean
  floating?: boolean
}

const modelValue = defineModel<Date>({ default: () => new Date(1970) })
const useNow = defineModel<boolean>('now', { default: false })

const props = withDefaults(defineProps<Props>(), {
  dates: () => [new Date(1970)],
  loading: false,
  floating: false,
})

const index = ref(0)
const currentDate = ref<Date>(modelValue.value)
const isPlaying = ref(false)
const intervalTimer = ref<ReturnType<typeof setInterval> | 0>(0)

const max = computed(() => Math.max(0, props.dates.length - 1))
const dateString = computed(() =>
  props.dates[index.value] ? props.dates[index.value].toLocaleString() : '',
)
const nowColor = computed(() => (useNow.value ? 'orange' : ''))
const playColor = computed(() => (isPlaying.value ? 'orange' : ''))
const floatingClass = computed(() =>
  props.floating ? 'floating' : 'non-floating',
)

function updateIndexValueChange(): void {
  if (modelValue.value && props.dates) {
    index.value = props.dates.findIndex(
      (date: Date) => modelValue.value.getTime() === date.getTime(),
    )
    currentDate.value = props.dates[index.value]
  }
}

watch(modelValue, updateIndexValueChange)

onMounted(() => {
  updateIndexValueChange()
  currentDate.value = modelValue.value
})

function togglePlay(): void {
  if (isPlaying.value) {
    isPlaying.value = false
    clearInterval(intervalTimer.value)
    intervalTimer.value = 0
  } else {
    isPlaying.value = true
    useNow.value = false
    intervalTimer.value = setInterval(play, 1000)
  }
}

function stopPlay(): void {
  if (intervalTimer.value) {
    isPlaying.value = false
    clearInterval(intervalTimer.value)
    intervalTimer.value = 0
  }
}

function play(): void {
  if (max.value === index.value) {
    stopPlay()
  } else {
    increment()
  }
}

function toggleNow(): void {
  useNow.value = !useNow.value
  if (useNow.value) {
    const now = new Date()
    for (let i = 0; i < props.dates.length; i++) {
      if (props.dates[i] > now) {
        index.value = Math.max(0, i - 1)
        break
      }
    }
    stopPlay()
    updateDate()
  }
}

function backward(step?: number): void {
  if (useNow.value) useNow.value = false
  decrement(step)
  if (isPlaying.value) stopPlay()
  intervalTimer.value = setInterval(() => decrement(step), 200)
}

function forward(step?: number): void {
  if (useNow.value) useNow.value = false
  increment(step)
  if (isPlaying.value) stopPlay()
  intervalTimer.value = setInterval(() => increment(step), 200)
}

function increment(step = 1): void {
  index.value = Math.min(max.value, index.value + step)
  inputChanged()
}

function decrement(step = 1): void {
  index.value = Math.max(0, index.value - step)
  inputChanged()
}

function updateDate(): void {
  currentDate.value = props.dates[index.value]
}

function onInput(): void {
  updateDate()
  inputChanged()
}

function inputChanged(): void {
  if (useNow.value) useNow.value = false
  if (props.dates[index.value]) modelValue.value = props.dates[index.value]
}
</script>
<style scoped>
.time-slider-container.non-floating {
  height: 48px;
}

.time-slider-container.floating {
  height: 63px;
  background-clip: content-box;
  padding: 0 15px 15px;
  filter: drop-shadow(3px 3px 3px #888);
}

</style>
