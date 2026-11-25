/**
 * Where the API lives. Laravel picks the tenant from the domain the API is
 * called on, so the frontend is opened on the tenant's own subdomain
 * (demo.localhost:3000) and calls the same host on Laravel's port
 * (demo.localhost:8000/api). A central domain (localhost) is not a tenant.
 */
export interface ApiLocation {
  /** Host the app was opened on, without port. */
  hostname: string
  /** True on a central domain: no tenant can be reached from here. */
  isCentral: boolean
  /** Base URL of the tenant API, without trailing slash. */
  baseUrl: string
}

export interface ApiEnv {
  VITE_API_PORT?: string
  VITE_API_URL?: string
  VITE_CENTRAL_DOMAINS?: string
}

const DEFAULT_PORT = '8000'
const DEFAULT_CENTRAL = 'localhost,127.0.0.1'

export function resolveApiLocation(location: Pick<Location, 'protocol' | 'hostname'>, env: ApiEnv): ApiLocation {
  const hostname = location.hostname.toLowerCase()
  const central = (env.VITE_CENTRAL_DOMAINS || DEFAULT_CENTRAL).split(',').map(domain => domain.trim().toLowerCase())

  return {
    hostname,
    isCentral: central.includes(hostname),
    baseUrl: env.VITE_API_URL
      ? env.VITE_API_URL.replace('{tenant}', hostname.split('.')[0] ?? '').replace(/\/$/, '')
      : `${location.protocol}//${hostname}:${env.VITE_API_PORT || DEFAULT_PORT}/api`,
  }
}

export const apiLocation = resolveApiLocation(window.location, import.meta.env)
