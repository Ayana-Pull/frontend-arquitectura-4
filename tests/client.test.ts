import { describe, expect, it } from 'vitest'
import { toApiError } from '@/api/client'

function response(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } })
}

describe('toApiError', () => {
  it('keeps the Spanish message and the field errors from Laravel', async () => {
    const error = await toApiError(response(422, { message: 'Credenciales incorrectas.', errors: { email: ['Credenciales incorrectas.'] } }))

    expect(error.status).toBe(422)
    expect(error.message).toBe('Credenciales incorrectas.')
    expect(error.firstFieldError('email')).toBe('Credenciales incorrectas.')
  })

  it('reads Retry-After from a paused login', async () => {
    const error = await toApiError(response(429, { message: 'Demasiados intentos. Intenta de nuevo en 30 segundos.' }, { 'Retry-After': '30' }))

    expect(error.retryAfter).toBe(30)
    expect(error.message).toBe('Demasiados intentos. Intenta de nuevo en 30 segundos.')
  })

  it('replaces the English throttle message', async () => {
    const error = await toApiError(response(429, { message: 'Too Many Attempts.' }))

    expect(error.message).toBe('Demasiadas solicitudes. Espera un momento.')
  })

  it('keeps extra fields such as the execution id of a 503', async () => {
    const error = await toApiError(response(503, { message: 'El servicio de agentes no está disponible. Inténtalo de nuevo.', execution_id: 'abc' }))

    expect(error.body.execution_id).toBe('abc')
  })

  it('falls back to a Spanish message when the body is not JSON', async () => {
    const error = await toApiError(new Response('<html>', { status: 500 }))

    expect(error.message).toBe('El servidor tuvo un problema. Inténtalo de nuevo.')
  })
})
