import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

/*
 * The app is opened on the tenant's own subdomain (http://demo.localhost:3000):
 * the API base is derived from that host (src/api/config.ts), so one build
 * serves every tenant. ".localhost" lets Vite answer on any <tenant>.localhost.
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 3000,
    strictPort: true,
    allowedHosts: ['.localhost'],
  },
  test: {
    environment: 'jsdom',
  },
})
