import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Contraseña de los usuarios de `seed_riesgoti` (back/apps/accounts/management/commands/seed_riesgoti.py). */
export const SEED_PASSWORD = 'RiesgoTI2026!'

export const USERS = {
  reporter: { email: 'lucia.ramirez@empresa.pe', firstName: 'Lucía', fullName: 'Lucía Ramírez', role: 'Reportante' },
  reporter2: { email: 'jorge.salas@empresa.pe', firstName: 'Jorge', fullName: 'Jorge Salas', role: 'Reportante' },
  analyst: { email: 'andrea.quispe@empresa.pe', firstName: 'Andrea', fullName: 'Andrea Quispe', role: 'Analista' },
  analyst2: { email: 'martin.torres@empresa.pe', firstName: 'Martín', fullName: 'Martín Torres', role: 'Analista' },
  admin: { email: 'carla.mendoza@empresa.pe', firstName: 'Carla', fullName: 'Carla Mendoza', role: 'Administrador' },
} as const

export type UserKey = keyof typeof USERS

const AUTH_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.auth')

/** Sesión guardada por `auth.setup.ts` (localStorage con el JWT) para no repetir el login en cada prueba. */
export const storageStateOf = (user: UserKey) => path.join(AUTH_DIR, `${user}.json`)
