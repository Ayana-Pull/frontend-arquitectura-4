import { describe, expect, it } from 'vitest'
import { resolveApiLocation } from '@/api/config'

describe('resolveApiLocation', () => {
  it('calls the tenant host the app was opened on, on the API port', () => {
    const location = resolveApiLocation({ protocol: 'http:', hostname: 'demo.localhost' }, { VITE_API_PORT: '8010' })

    expect(location).toEqual({ hostname: 'demo.localhost', isCentral: false, baseUrl: 'http://demo.localhost:8010/api' })
  })

  it('defaults to port 8000', () => {
    expect(resolveApiLocation({ protocol: 'http:', hostname: 'demo.localhost' }, {}).baseUrl).toBe('http://demo.localhost:8000/api')
  })

  it('marks central domains, which reach no tenant', () => {
    expect(resolveApiLocation({ protocol: 'http:', hostname: 'localhost' }, {}).isCentral).toBe(true)
    expect(resolveApiLocation({ protocol: 'http:', hostname: '127.0.0.1' }, {}).isCentral).toBe(true)
    expect(resolveApiLocation({ protocol: 'http:', hostname: 'app.test' }, { VITE_CENTRAL_DOMAINS: 'app.test' }).isCentral).toBe(true)
  })

  it('fills {tenant} in a fixed API URL with the first label of the host', () => {
    const location = resolveApiLocation(
      { protocol: 'https:', hostname: 'acme.orquestador.app' },
      { VITE_API_URL: 'https://{tenant}.api.orquestador.app/api/' },
    )

    expect(location.baseUrl).toBe('https://acme.api.orquestador.app/api')
  })
})
