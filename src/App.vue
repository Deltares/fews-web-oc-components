<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png" />
    <vue2ssd-viewer />
    <date-time-slider />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Vue2SsdViewer from './components/Vue2ssdViewer'
import DateTimeSlider from './components/DateTimeSlider'

@Component({
  components: {
    Vue2SsdViewer,
    DateTimeSlider
  }
})
export default class App extends Vue {}
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
