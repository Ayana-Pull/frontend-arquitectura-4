import { apiLocation } from './config'

/**
 * A failed API call. Laravel answers errors as { message, errors? } in Spanish;
 * status 0 means the server could not be reached.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fieldErrors: Record<string, string[]> = {},
    public readonly retryAfter: number | null = null,
    public readonly body: Record<string, unknown> = {},
  ) {
    super(message)
    this.name = 'ApiError'
  }

  get isOffline(): boolean {
    return this.status === 0
  }

  firstFieldError(field: string): string | undefined {
    return this.fieldErrors[field]?.[0]
  }
}

const FALLBACK_MESSAGES: Record<number, string> = {
  0: 'No se pudo conectar con el servidor.',
  401: 'No autenticado.',
  403: 'No tienes permiso para hacer esto.',
  404: 'El recurso no existe.',
  429: 'Demasiadas solicitudes. Espera un momento.',
  500: 'El servidor tuvo un problema. Inténtalo de nuevo.',
  503: 'El servicio no está disponible. Inténtalo de nuevo.',
}

/** Laravel's throttle middleware answers in English; these statuses always use our message. */
const ALWAYS_FALLBACK = new Set([429])

export async function toApiError(response: Response): Promise<ApiError> {
  const body = await response.json().catch(() => ({})) as Record<string, unknown>
  const retryAfter = Number(response.headers.get('Retry-After')) || null
  const message = typeof body.message === 'string' && body.message && !isGenericThrottle(response.status, body.message)
    ? body.message
    : FALLBACK_MESSAGES[response.status] ?? FALLBACK_MESSAGES[500]!
  const errors = (body.errors && typeof body.errors === 'object' ? body.errors : {}) as Record<string, string[]>

  return new ApiError(response.status, message, errors, retryAfter, body)
}

function isGenericThrottle(status: number, message: string): boolean {
  return ALWAYS_FALLBACK.has(status) && message === 'Too Many Attempts.'
}

type UnauthorizedHandler = () => void

let token: string | null = null
let onUnauthorized: UnauthorizedHandler | null = null

export function setApiToken(value: string | null): void {
  token = value
}

/** Called once per 401 on an authenticated call (expired or revoked token). */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler
}

interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  signal?: AbortSignal
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${apiLocation.baseUrl}/${path.replace(/^\//, '')}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    })
  }
  catch (error) {
    if ((error as Error).name === 'AbortError') throw error
    throw new ApiError(0, FALLBACK_MESSAGES[0]!)
  }

  if (!response.ok) {
    const error = await toApiError(response)
    if (error.status === 401 && token) onUnauthorized?.()
    throw error
  }

  return response.status === 204 ? undefined as T : await response.json() as T
}
