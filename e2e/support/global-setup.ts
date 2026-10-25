import { execFileSync } from 'node:child_process'
import { COMPOSE_FILE, COMPOSE_PROJECT, E2E_HEALTH_URL, stackMode } from './stack'

const compose = (...args: string[]) =>
  execFileSync('docker', ['compose', '-f', COMPOSE_FILE, '-p', COMPOSE_PROJECT, ...args], { stdio: 'inherit' })

async function isHealthy(): Promise<boolean> {
  try {
    const res = await fetch(E2E_HEALTH_URL, { signal: AbortSignal.timeout(3000) })
    return res.ok
  } catch {
    return false
  }
}

function assertDockerRunning() {
  try {
    execFileSync('docker', ['info'], { stdio: 'ignore' })
  } catch {
    throw new Error('Docker no responde. Inicia Docker Desktop y vuelve a ejecutar las pruebas (o usa E2E_STACK=off para el smoke).')
  }
}

/**
 * Levanta el stack aislado de docker-compose.e2e.yml antes de la suite. `up --wait` espera los healthchecks:
 * el backend solo está sano cuando terminó `migrate` + `seed_riesgoti` y el worker responde a `celery inspect ping`.
 * Devuelve el teardown que Playwright ejecuta al terminar.
 */
export default async function globalSetup() {
  const mode = stackMode()
  if (mode === 'off') return

  if (mode === 'reuse' && (await isHealthy())) {
    console.log('ℹ️  [e2e] Reutilizando el stack E2E en ejecución (E2E_STACK=reuse).')
    return
  }

  assertDockerRunning()
  if (mode !== 'reuse') {
    console.log('ℹ️  [e2e] Recreando el stack E2E desde cero (BD + semilla)…')
    compose('down', '-v', '--remove-orphans')
  }
  const started = Date.now()
  compose('up', '-d', '--wait')
  if (!(await isHealthy())) throw new Error(`El backend E2E no responde en ${E2E_HEALTH_URL}.`)
  console.log(`✅ [e2e] Stack E2E listo en ${Math.round((Date.now() - started) / 1000)} s.`)

  if (mode === 'fresh') {
    return async () => {
      console.log('ℹ️  [e2e] Destruyendo el stack E2E (usa E2E_STACK=keep para conservarlo).')
      compose('down', '-v', '--remove-orphans')
    }
  }
}
