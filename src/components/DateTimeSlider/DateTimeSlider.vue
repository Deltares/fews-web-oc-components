<template>
  <div class="date-time-slider">
    <Keypress key-event="keydown" @any="keydownListener" />
    <Keypress key-event="keyup" @any="keyupListener" />
    <div style="display:flex;flex-direction:row;flex-grow:1;padding:6px 16px">
      <slot name="prepend"></slot>
      <div style="width:1px;height:100%;max-height:100%;background-color:lightgray;">
      </div>
      <div style="display:flex;flex-grow:1;justify-content:space-between">
        <div style="display:flex;">
          <v-btn icon :color="nowColor" @click="toggleNow" ref="NowButton">
            <v-icon>mdi-clock</v-icon>
          </v-btn>
          <div style="margin:auto;width:15ch;flex:2 0 20%" class="body-2"> {{ dateString }}</div>
        </div>
        <div style="display:flex;">
          <v-btn @mousedown="backward()" @mouseup="stopPlay" icon ref="BackButton">
            <v-icon>
              mdi-skip-previous
            </v-icon>
          </v-btn>
          <v-btn :color="playColor" icon @click="togglePlay" ref="PlayButton">
            <v-icon>
              {{ isPlaying ? 'mdi-pause' : 'mdi-play' }}
            </v-icon>
          </v-btn>
          <v-btn @mousedown="forward()" @mouseup="stopPlay" icon ref="ForwardButton">
            <v-icon>
              mdi-skip-next
            </v-icon>
          </v-btn>
        </div>
        <slot name="append"></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch, Vue } from 'vue-property-decorator'
import { throttle } from 'lodash'
import KeyPressObject from 'vue-keypress'

// import * as d3 from 'd3'
@Component({
  components: {
    Keypress: () => import('vue-keypress')
  }
})
export default class DateTimeSlider extends Vue {
  @Prop({ default: () => { return new Date() } }) private value!: Date
  @Prop({ default: () => { return [new Date()] } }) private dates!: Date[]

  index = 0
  currentDate!: Date
  useNow = true
  isPlaying = false
  intervalTimer: any = 0
  throttledUpdate!: any

  created (): void {
    this.updateIndexValueChange()
    this.currentDate = this.value
    this.$emit('select-now', this.useNow)
    this.throttledUpdate = throttle(this.inputChanged, 1000, { leading: true, trailing: true })
  }

  get max (): number {
    return Math.max(0, this.dates.length - 1)
  }

  get nowInDateRange (): boolean {
    return true
  }

  get dateString (): string {
    // TODO: need to think about internationalization here, or at least a string format
    return this.dates[this.index] ? this.dates[this.index].toLocaleString() : ''
  }

  get nowColor (): string {
    return this.useNow ? 'orange' : ''
  }

  get playColor (): string {
    return this.isPlaying ? 'orange' : ''
  }

  togglePlay (): void {
    if (this.isPlaying) {
      this.isPlaying = false
      clearInterval(this.intervalTimer)
      this.intervalTimer = 0
    } else {
      this.isPlaying = true
      this.useNow = false
      this.intervalTimer = setInterval(this.play, 200)
    }
  }

  stopPlay (): void {
    if (this.intervalTimer) {
      this.isPlaying = false
      clearInterval(this.intervalTimer)
      this.intervalTimer = 0
    }
  }

  play (): void {
    if (this.max === this.index) {
      this.stopPlay()
    } else {
      this.increment()
    }
  }

  @Watch('value')
  @Watch('dates')
  updateIndexValueChange (): void {
    if (this.value && this.dates) {
      this.index = this.dates.findIndex((date: Date) => { return this.value.getTime() === date.getTime() })
      this.currentDate = this.dates[this.index]
    }
  }

  toggleNow (): void {
    this.useNow = !this.useNow
    if (this.useNow) {
      const now = new Date()
      for (let i = 0; i < this.dates.length; i++) { // Loop the array
        if (this.dates[i] > now) {
          this.index = Math.max(0, i - 1)
          break
        }
      }
      this.stopPlay()
      this.updateDate()
    }
    this.$emit('select-now', this.useNow)
    if (this.dates[this.index]) this.$emit('input', this.dates[this.index])
  }

  backward (step?: number): void {
    if (this.useNow) {
      this.useNow = false
      this.$emit('select-now', this.useNow)
    }
    this.decrement(step)
    if (this.isPlaying) this.stopPlay()
    this.intervalTimer = setInterval(() => this.decrement(step), 200)
  }

  forward (step?: number): void {
    if (this.useNow) {
      this.useNow = false
      this.$emit('select-now', this.useNow)
    }
    this.increment(step)
    if (this.isPlaying) this.stopPlay()
    this.intervalTimer = setInterval(() => this.increment(step), 200)
  }

  increment (step = 1): void {
    this.index = Math.min(this.max, this.index + step)
    this.updateDate()
    this.inputChanged()
  }

  decrement (step = 1): void {
    this.index = Math.max(0, this.index - step)
    this.updateDate()
    this.inputChanged()
  }

  updateDate (): void {
    this.currentDate = this.dates[this.index]
  }

  onInput (): void {
    this.updateDate()
    this.throttledUpdate()
  }

  inputChanged (): void {
    if (this.useNow) {
      this.useNow = false
      this.$emit('select-now', this.useNow)
    }
    if (this.dates[this.index]) this.$emit('input', this.dates[this.index])
  }

  keydownListener (input: KeyPressObject): void {
    const event = (input as any).event
    switch (event.code) {
      case 'ArrowRight':
        if (!event.repeat) this.forward(event.shiftKey ? 6 : 1)
        break
      case 'ArrowLeft':
        if (!event.repeat) this.backward(event.shiftKey ? 6 : 1)
        break
      case 'KeyN':
        this.toggleNow()
        break
      case 'Space':
        this.togglePlay()
        break
      default:
        break
    }
  }

  keyupListener (input: any): void {
    const event = input.event
    switch (event.code) {
      case 'ArrowRight':
        this.stopPlay()
        break
      case 'ArrowLeft':
        this.stopPlay()
        break
      default:
        break
    }
  }
}
</script>
<style scoped>
.time-slider-container {
  height: 104px;
  z-index: 100;
}
</style>
