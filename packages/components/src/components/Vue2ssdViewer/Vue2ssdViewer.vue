//Text.vue
<template>
  <div class="text">{{ data || 'No Data' }}</div>
</template>

<script setup lang="ts">
interface Props {
  data?: string
}

const props = defineProps<Props>()
const data = props.data
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
