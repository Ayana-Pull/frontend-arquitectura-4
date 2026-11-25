import type { ExecutionStatus } from '@/api/types'

/** How the system voice (mono, lowercase) names each execution status. */
export const STATUS_LABELS: Record<ExecutionStatus, string> = {
  pending: 'en cola',
  running: 'pensando',
  cancelling: 'deteniendo',
  completed: 'completada',
  failed: 'falló',
  cancelled: 'detenida',
  timed_out: 'tiempo agotado',
}

/** Error codes Laravel or pi-service store on a failed execution. */
const ERROR_MESSAGES: Record<string, string> = {
  pi_service_unavailable: 'El servicio de agentes no está disponible. Inténtalo de nuevo.',
  start_failed: 'No se pudo iniciar la ejecución.',
  node_restarted: 'El servicio de agentes se reinició durante la ejecución.',
}

export function describeError(error: string | null): string {
  if (!error) return 'La respuesta no se completó.'
  return ERROR_MESSAGES[error] ?? error
}

export function formatElapsed(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  return seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)} min ${seconds % 60} s`
}
