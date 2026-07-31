import App from '@/App.vue'
import MainComponent from '@/components/MainComponent.vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: App,
  },
  {
    path: '/main',
    component: MainComponent,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
