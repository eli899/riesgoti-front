// Lanzador multiplataforma de la suite E2E: `node e2e/support/run.mjs <modo> [argumentos de playwright]`.
// Fija E2E_STACK (fresh | keep | reuse | off) sin depender de la sintaxis de variables de cada shell, y ejecuta la
// CLI de Playwright con Node directamente (sin shell intermedia) para no reinterpretar argumentos como `-g "a|b"`.
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const [mode, ...args] = process.argv.slice(2)
const result = spawnSync(process.execPath, [require.resolve('@playwright/test/cli'), 'test', ...args], {
  stdio: 'inherit',
  env: { ...process.env, E2E_STACK: mode },
})
process.exit(result.status ?? 1)
