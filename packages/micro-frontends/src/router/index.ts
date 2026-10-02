import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import MainComponent from '../components/MainComponent.vue'
import CriticalPointsOverview from '../components/CriticalPointsOverview.vue'
import DemoLanding from '../components/DemoLanding.vue'
import {
  criticalPointsTopologyNode,
  mainTopologyNode,
  resolveSelectedTime,
} from '../demoConfig.js'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'landing',
    component: DemoLanding,
  },
  {
    path: '/main',
    name: 'main',
    component: MainComponent,
    props: (route) => ({
      topologyNode: mainTopologyNode,
      locationIds:
        typeof route.query.locationIds === 'string'
          ? route.query.locationIds
          : undefined,
    }),
  },
  {
    path: '/critical-points',
    name: 'critical-points',
    component: CriticalPointsOverview,
    props: (route) => ({
      topologyNode: criticalPointsTopologyNode,
      selectedDate: new Date(resolveSelectedTime(route.query.selectedTime)),
      locationIds:
        typeof route.query.locationIds === 'string'
          ? route.query.locationIds
          : undefined,
    }),
  },
]

const router = createRouter({
  history: createWebHistory(new URL(import.meta.env.BASE_URL, window.location.origin).pathname),
  routes,
})

export default router
