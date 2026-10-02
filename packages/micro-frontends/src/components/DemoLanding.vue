<template>
  <v-container class="py-8" max-width="960">
    <h1 class="text-headline-medium mb-2">FEWS WebOC micro frontend demos</h1>
    <p class="text-body-medium text-medium-emphasis mb-6">
      Select a micro frontend component to open it with sample data.
    </p>

    <v-row>
      <v-col v-for="demo in demos" :key="demo.to" cols="12" sm="6">
        <v-card
          :to="demo.to"
          :prepend-icon="demo.icon"
          :title="demo.title"
          :subtitle="demo.subtitle"
          :text="demo.text"
          class="h-100"
          variant="outlined"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
const demos = [
  {
    to: '/main',
    icon: 'mdi-earth',
    title: 'Main panel',
    subtitle: 'Palmiet locations',
    text: 'Locations from a FEWS filter on an interactive globe.',
  },
  {
    to: '/critical-points',
    icon: 'mdi-map-marker-alert',
    title: 'Critical points',
    subtitle: 'Rivers forecast overview',
    text: 'Forecasted water levels at critical points, ranked by threshold exceedance.',
  },
]
</script>
