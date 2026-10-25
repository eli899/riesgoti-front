import { Navigate, Outlet } from 'react-router-dom'
import { useAuthSession } from '@/hooks/useAuthSession'
import type { PermissionCode } from '@/types/domain.types'

interface PermissionRouteProps {
  /** Permiso RBAC exigido (ROL_PERMISO) para las rutas anidadas. */
  permission: PermissionCode
  /** Ruta de inicio del portal a la que se redirige si falta el permiso. */
  redirectTo: string
}

/**
 * Guardia RBAC de rutas: una URL escrita a mano no abre una sección sin permiso (p. ej. el ADMIN no llega a la cola
 * de atención ni a acciones de evaluación, INV-05); el backend sigue siendo la autoridad con su 403.
 */
export default function PermissionRoute({ permission, redirectTo }: PermissionRouteProps) {
  const { hasPermission } = useAuthSession()
  return hasPermission(permission) ? <Outlet /> : <Navigate replace to={redirectTo} />
}
