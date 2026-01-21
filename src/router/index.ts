import { createRouter, createWebHistory } from 'vue-router'
import { useSystemStore } from '@/stores/system'


import { routes } from './routes'

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(async (to, _, next) => {
  const systemStore = useSystemStore()

  // Check initialization status if not already checked
  const isInitialized = await systemStore.checkInitialization()

  if (!isInitialized && to.path !== '/init') {
    next('/init')
    return
  }

  if (isInitialized && to.path === '/init') {
    next('/login')
    return
  }

  next()
})


export default router
