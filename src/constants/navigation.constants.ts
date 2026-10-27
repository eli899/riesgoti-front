import type { RoleCode } from '@/constants/rbac.constants'

/** Textos de la navegación lateral de los portales y de los enlaces de regreso de las vistas de detalle. */
export const NAV_LABELS = {
  HOME: 'Inicio',
  MY_INCIDENTS: 'Mis incidencias',
  DASHBOARD: 'Resumen',
  INCIDENTS: 'Incidencias',
  SUPPORT: 'Atención de incidencias',
  RISKS: 'Registro de riesgos',
  PROPOSALS: 'Propuestas de riesgo',
  ASSETS: 'Activos',
  MATRIX: 'Matriz de evaluación',
  DOCUMENTS: 'Documentos',
  AI_CONFIG: 'Configuración IA/RAG',
  USERS: 'Usuarios',
  ROLES: 'Roles y permisos',
  AUDIT: 'Auditoría',
  ACCOUNT: 'Mi cuenta',
} as const

/** Grupos visibles del menú lateral. */
export const NAV_GROUPS = {
  GENERAL: 'General',
  OPERATION: 'Operación',
  QUERY: 'Consulta',
  RISK_GOVERNANCE: 'Gobierno de riesgos',
  ARTIFICIAL_INTELLIGENCE: 'Inteligencia artificial',
  ACCESS: 'Accesos',
  ACCOUNT: 'Cuenta',
} as const

/** `aria-label` del `<nav>` principal de cada portal. */
export const PORTAL_NAV_ARIA_LABELS = {
  ADMIN: 'Navegación principal por rol: Administrador',
  ANALISTA: 'Navegación principal por rol: Analista',
  REPORTANTE: 'Navegación principal por rol: Reportante',
} as const satisfies Record<RoleCode, string>
