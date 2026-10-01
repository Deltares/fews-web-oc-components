import App from '@/App.vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: App,
  },
  {
    path: '/main',
    component: App,
  },
]

const router = createRouter({
  history: createWebHistory(new URL(import.meta.env.BASE_URL, window.location.origin).pathname),
  routes,
})

export default router
