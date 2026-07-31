<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png" />
    <vue-2-ssd-viewer />
    <date-time-slider />
  </div>
</template>

<script setup lang="ts">
import Vue2SsdViewer from './components/Vue2ssdViewer'
import DateTimeSlider from './components/DateTimeSlider'
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
