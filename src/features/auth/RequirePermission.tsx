import type { ReactNode } from 'react'
import { ShieldAlert } from 'lucide-react'
import { useAuthSession } from '@/hooks/useAuthSession'
import type { PermissionCode } from '@/types/domain.types'

interface RequirePermissionProps {
  /** Permiso RBAC exigido (ROL_PERMISO). Si se omite, basta con tener sesión. */
  requiredPermission?: PermissionCode
  /** Segregación de Funciones: un ADMIN nunca evalúa ni valida riesgos (HTTP 403 en backend). */
  forbidAdminSoD?: boolean
  /** Qué mostrar si falta el permiso. Por defecto no se renderiza nada. */
  fallback?: ReactNode
  children: ReactNode
}

export function SoDNotice() {
  return (
    <aside role="status" aria-label="Segregación de funciones" className="flex items-start gap-3 rounded-[14px] border border-dashed border-primary bg-soft p-4">
      <ShieldAlert size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden />
      <p className="text-[13px] text-muted">
        <strong className="block font-semibold text-deep">Modo solo lectura · Segregación de funciones ISO/IEC 27001</strong>
        El rol Administrador no puede evaluar ni validar riesgos. Estas acciones corresponden exclusivamente al rol Analista.
      </p>
    </aside>
  )
}

/** Guardia declarativa RBAC + SoD para controles y secciones mutables. */
export default function RequirePermission({ requiredPermission, forbidAdminSoD = false, fallback = null, children }: RequirePermissionProps) {
  const { isAuthenticated, roleCode, hasPermission } = useAuthSession()

  if (!isAuthenticated) return <>{fallback}</>
  if (forbidAdminSoD && roleCode === 'ADMIN') return <SoDNotice />
  if (requiredPermission && !hasPermission(requiredPermission)) return <>{fallback}</>
  return <>{children}</>
}
