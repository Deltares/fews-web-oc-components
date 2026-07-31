<template>
  <div class="time-slider-container" :class="[themeClass, floatingClass]">
    <v-slider
      v-model="index"
      :max="max"
      step="1"
      tick-size="6"
      tabindex="0"
      @update:modelValue="onInput"
      hide-details
      height="0"
    >
    </v-slider>
    <div
      style="
        display: flex;
        flex-direction: row;
        flex-grow: 1;
        padding: 6px 16px;
      "
    >
      <slot name="prepend"></slot>
      <div
        style="
          width: 1px;
          height: 100%;
          max-height: 100%;
          background-color: lightgray;
        "
      ></div>
      <div style="display: flex; flex-grow: 1; justify-content: space-between">
        <div style="display: flex">
          <v-btn icon :color="nowColor" @click="toggleNow">
            <v-icon v-if="loading">mdi-loading mdi-spin</v-icon>
            <v-icon v-else>mdi-clock</v-icon>
          </v-btn>
          <div style="margin: auto; width: 30ch; flex: 2 0 20%" class="body-2">
            {{ dateString }}
          </div>
        </div>
        <div style="display: flex">
          <v-btn
            @mousedown="backward()"
            @mouseup="stopPlay"
            icon
            ref="BackButton"
          >
            <v-icon> mdi-skip-previous </v-icon>
          </v-btn>
          <v-btn :color="playColor" icon @click="togglePlay" ref="PlayButton">
            <v-icon>
              {{ isPlaying ? 'mdi-pause' : 'mdi-play' }}
            </v-icon>
          </v-btn>
          <v-btn
            @mousedown="forward()"
            @mouseup="stopPlay"
            icon
            ref="ForwardButton"
          >
            <v-icon> mdi-skip-next </v-icon>
          </v-btn>
          <slot name="append"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useTheme } from 'vuetify'

interface Props {
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

const theme = useTheme()

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
const themeClass = computed(() => (theme.current.value.dark ? 'dark' : 'light'))
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

.time-slider-container.dark {
  background-color: black;
}

.time-slider-container.light {
  background-color: white;
}
</style>
