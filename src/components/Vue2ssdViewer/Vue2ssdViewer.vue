//Text.vue
<template>
  <div class="text">{{ data || 'No Data' }}</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
@Component({})
export default class Vue2ssdViewer extends Vue {
  @Prop() data!: string;
}
</script>

<style scoped lang="scss">
.text {
  width: 400px;
  border: 1px solid red;
  border-radius: 5px;
  padding: 1.5rem;
  font-size: 1.5rem;
  letter-spacing: 2px;
  text-align: center;
  &--large {
    font-size: 2.5rem;
  }
}
</style>
