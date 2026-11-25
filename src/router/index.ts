import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    /** Reachable without a session (login). */
    public?: boolean
    /** Main area without the default width and padding. */
    fullBleed?: boolean
    title?: string
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/chat' },
    { path: '/login', component: () => import('@/views/LoginView.vue'), meta: { public: true, title: 'Iniciar sesión' } },
    { path: '/chat', component: () => import('@/views/ChatView.vue'), meta: { fullBleed: true, title: 'Chat' } },
    { path: '/accesos', component: () => import('@/views/AccessView.vue'), meta: { title: 'Accesos' } },
    { path: '/:pathMatch(.*)*', redirect: '/chat' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isLoggedIn) {
    return { path: '/login', query: to.fullPath === '/chat' ? {} : { redirect: to.fullPath } }
  }
  if (to.path === '/login' && auth.isLoggedIn) return '/chat'
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · orquestador` : 'orquestador'
})
