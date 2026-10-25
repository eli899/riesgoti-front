/**
 * Fuente única de las rutas del frontend (react-router-dom-patterns + constants-no-magic-strings). Es TypeScript puro,
 * sin React, para que la suite E2E (front/e2e/) navegue con las mismas constantes que la aplicación.
 */

/** Nombres de los parámetros dinámicos de ruta, leídos con `useRouteId`. */
export const ROUTE_PARAMS = {
  INCIDENT_ID: 'incidentId',
  RISK_ID: 'riskId',
  VERSION_ID: 'versionId',
} as const

export type RouteParam = (typeof ROUTE_PARAMS)[keyof typeof ROUTE_PARAMS]

const MY_INCIDENTS = '/my-incidents'
const INCIDENTS = '/incidents'
const SUPPORT = '/support'
const RISKS = '/risks'
const PROPOSALS = '/proposals'

/** Patrones de ruta para declarar `<Route path>`. Cada portal monta solo los que su rol y permisos admiten. */
export const ROUTE_PATHS = {
  ROOT: '/',
  LOGIN: '/login',
  WILDCARD: '*',
  // Reportante
  HOME: '/home',
  MY_INCIDENTS,
  MY_INCIDENT_DETAIL: `${MY_INCIDENTS}/:${ROUTE_PARAMS.INCIDENT_ID}`,
  // Analista y Administrador
  DASHBOARD: '/dashboard',
  INCIDENTS,
  INCIDENT_DETAIL: `${INCIDENTS}/:${ROUTE_PARAMS.INCIDENT_ID}`,
  SUPPORT,
  SUPPORT_CASE: `${SUPPORT}/:${ROUTE_PARAMS.INCIDENT_ID}`,
  RISKS,
  RISK_DETAIL: `${RISKS}/:${ROUTE_PARAMS.RISK_ID}`,
  PROPOSALS,
  PROPOSAL_WORKSPACE: `${PROPOSALS}/:${ROUTE_PARAMS.VERSION_ID}`,
  ASSETS: '/assets',
  MATRIX: '/matrix',
  // Administrador
  DOCUMENTS: '/documents',
  AI_CONFIG: '/ai-config',
  USERS: '/users',
  ROLES: '/roles',
  AUDIT: '/audit',
  // Todos los roles
  ACCOUNT: '/account',
} as const

export type RoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS]

/** URLs navegables: rutas estáticas y constructores tipados para las de detalle. */
export const ROUTES = {
  ROOT: ROUTE_PATHS.ROOT,
  LOGIN: ROUTE_PATHS.LOGIN,
  HOME: ROUTE_PATHS.HOME,
  MY_INCIDENTS: ROUTE_PATHS.MY_INCIDENTS,
  MY_INCIDENT_DETAIL: (incidentId: number) => `${MY_INCIDENTS}/${incidentId}`,
  DASHBOARD: ROUTE_PATHS.DASHBOARD,
  INCIDENTS: ROUTE_PATHS.INCIDENTS,
  INCIDENT_DETAIL: (incidentId: number) => `${INCIDENTS}/${incidentId}`,
  SUPPORT: ROUTE_PATHS.SUPPORT,
  SUPPORT_CASE: (incidentId: number) => `${SUPPORT}/${incidentId}`,
  RISKS: ROUTE_PATHS.RISKS,
  RISK_DETAIL: (riskId: number) => `${RISKS}/${riskId}`,
  PROPOSALS: ROUTE_PATHS.PROPOSALS,
  PROPOSAL_WORKSPACE: (versionId: number) => `${PROPOSALS}/${versionId}`,
  ASSETS: ROUTE_PATHS.ASSETS,
  MATRIX: ROUTE_PATHS.MATRIX,
  DOCUMENTS: ROUTE_PATHS.DOCUMENTS,
  AI_CONFIG: ROUTE_PATHS.AI_CONFIG,
  USERS: ROUTE_PATHS.USERS,
  ROLES: ROUTE_PATHS.ROLES,
  AUDIT: ROUTE_PATHS.AUDIT,
  ACCOUNT: ROUTE_PATHS.ACCOUNT,
} as const
