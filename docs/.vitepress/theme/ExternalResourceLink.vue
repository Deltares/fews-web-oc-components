<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    href: string
    source?: string
    title: string
  }>(),
  {
    source: 'External',
  },
)
</script>

<template>
  <a
    class="external-resource-link"
    :href="props.href"
    target="_blank"
    rel="noreferrer"
  >
    <span class="external-resource-link__source">{{ props.source }}:</span>
    <span class="external-resource-link__title">{{ props.title }}</span>
    <svg
      class="external-resource-link__icon"
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path
        d="M6 4h6v6M12 4 4 12"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </a>
</template>