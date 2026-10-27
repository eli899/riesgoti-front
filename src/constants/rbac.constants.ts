/**
 * Catálogo RBAC (ROL / PERMISO / ROL_PERMISO). Espejo de back/apps/accounts/rbac.py.
 */

/** ROL.codigo de los roles de sistema. */
export const ROLES = {
  REPORTANTE: 'REPORTANTE',
  ANALISTA: 'ANALISTA',
  ADMIN: 'ADMIN',
} as const

export type RoleCode = (typeof ROLES)[keyof typeof ROLES]

export const SYSTEM_ROLE_CODES: readonly string[] = Object.values(ROLES)

/** PERMISO.codigo */
export const PERMISSIONS = {
  INCIDENT_CREATE: 'incidencia.crear',
  INCIDENT_VIEW_OWN: 'incidencia.ver_propias',
  INCIDENT_VIEW_ALL: 'incidencia.ver_todas',
  INCIDENT_CLOSE_OWN_BY_FEEDBACK: 'incidencia.cerrar_propias_por_feedback',
  ATTENTION_VIEW_QUEUE: 'atencion.ver_cola',
  ATTENTION_ATTEND: 'atencion.atender',
  RISK_REVIEW_GROUPING: 'riesgo.revisar_agrupacion',
  RISK_EVALUATE: 'riesgo.evaluar',
  RISK_VALIDATE: 'riesgo.validar',
  RISK_QUERY: 'riesgo.consultar',
  ASSET_ADMIN: 'activo.administrar',
  DOCUMENT_ADMIN: 'documento.administrar',
  MATRIX_ADMIN: 'matriz.administrar',
  USER_ADMIN: 'usuario.administrar',
  ROLE_ADMIN: 'rol.administrar',
} as const

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

/** Segregación de Funciones (INV-05, ISO/IEC 27001 A.5.3): permisos de evaluación/decisión de riesgos. */
export const SOD_RISK_PERMISSIONS: readonly PermissionCode[] = [
  PERMISSIONS.RISK_REVIEW_GROUPING,
  PERMISSIONS.RISK_EVALUATE,
  PERMISSIONS.RISK_VALIDATE,
]

/** Permisos de administración que no pueden convivir con SOD_RISK_PERMISSIONS en un mismo rol. */
export const ADMINISTRATIVE_PERMISSIONS: readonly PermissionCode[] = [
  PERMISSIONS.USER_ADMIN,
  PERMISSIONS.ROLE_ADMIN,
  PERMISSIONS.MATRIX_ADMIN,
  PERMISSIONS.DOCUMENT_ADMIN,
  PERMISSIONS.ASSET_ADMIN,
]

/** Permisos que el rol ADMIN debe conservar para no perder el gobierno de la plataforma. */
export const ADMIN_REQUIRED_PERMISSIONS: readonly PermissionCode[] = [PERMISSIONS.USER_ADMIN, PERMISSIONS.ROLE_ADMIN]

/** Pertenencia de un código recibido como `string` (formularios, API) a una lista tipada de permisos. */
export const includesPermission = (list: readonly PermissionCode[], code: string): boolean =>
  (list as readonly string[]).includes(code)
