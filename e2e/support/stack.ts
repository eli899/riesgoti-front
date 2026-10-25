import { fileURLToPath } from 'node:url'
import path from 'node:path'

/** Puertos y URLs del stack E2E aislado (docker-compose.e2e.yml), distintos de los de desarrollo (8000 / 5173). */
export const E2E_FRONT_PORT = 5174
export const E2E_FRONT_URL = `http://localhost:${E2E_FRONT_PORT}`
export const E2E_API_URL = 'http://localhost:8001/api/v1'
export const E2E_HEALTH_URL = `${E2E_API_URL}/health/`

export const COMPOSE_FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../docker-compose.e2e.yml')
export const COMPOSE_PROJECT = 'riesgoti-e2e'

/**
 * Modo de gestión del stack (variable E2E_STACK):
 * - fresh (por defecto): recrea el stack desde cero (BD vacía + semilla) y lo destruye al terminar.
 * - keep: igual que fresh, pero lo deja levantado al terminar para inspeccionarlo.
 * - reuse: usa el stack si ya responde (estado sucio incluido) o lo levanta si no; no lo destruye.
 * - off: no gestiona Docker (solo pruebas que no usan el backend, p. ej. smoke).
 */
export type StackMode = 'fresh' | 'keep' | 'reuse' | 'off'

export function stackMode(): StackMode {
  const raw = (process.env.E2E_STACK ?? 'fresh').toLowerCase()
  if (raw === 'fresh' || raw === 'keep' || raw === 'reuse' || raw === 'off') return raw
  throw new Error(`E2E_STACK="${raw}" no es válido. Usa fresh, keep, reuse u off.`)
}
