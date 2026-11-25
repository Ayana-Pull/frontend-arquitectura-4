import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { useAuthStore } from './stores/auth'
import { useTenantStore } from './stores/tenant'
import './styles/tokens.css'
import './styles/base.css'
import './styles/motion.css'

/**
 * Boot: ask which tenant this domain opens, restore the saved session for it,
 * then start routing (the guard needs to know whether there is a session).
 */
const app = createApp(App).use(createPinia())

const tenant = useTenantStore()
await tenant.load()
if (tenant.state === 'ready') await useAuthStore().restore()

app.use(router).mount('#app')
