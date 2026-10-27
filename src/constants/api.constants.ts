/**
 * Contrato de red de los servicios RTK Query: rutas REST relativas a VITE_API_BASE_URL, tags de caché y métodos HTTP.
 * Espejo de config/urls.py y de los routers de back/apps/<app>/urls.py.
 */

/** Tags de invalidación de caché de RTK Query. */
export const API_TAGS = {
  AI_CONFIG: 'AIConfig',
  DOCUMENT_VERSION: 'DocumentVersion',
  INCIDENT: 'Incident',
  OPERATIONAL_GUIDANCE: 'OperationalGuidance',
  RISK_VERSION: 'RiskVersion',
  RISK_DASHBOARD: 'RiskDashboard',
  MATRIX_CONFIG: 'MatrixConfig',
  ASSET: 'Asset',
  USER: 'User',
  ROLE: 'Role',
} as const

export type ApiTag = (typeof API_TAGS)[keyof typeof API_TAGS]

export const HTTP_METHODS = {
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
} as const

/** Acciones sobre una VERSION_DOCUMENTO (segmento final de su ruta). */
export const DOCUMENT_ACTIONS = {
  AUTHORIZE: 'authorize',
  ACTIVATE: 'activate',
  DEACTIVATE: 'deactivate',
  RETRY: 'retry',
  REINDEX: 'reindex',
} as const

export type DocumentAction = (typeof DOCUMENT_ACTIONS)[keyof typeof DOCUMENT_ACTIONS]

const AUTH = 'auth'
const ADMIN = 'admin'
const DOCUMENT_VERSIONS = `${ADMIN}/document-versions`
const INCIDENTS = 'incidents'
const RISK_VERSIONS = 'risk-versions'

/** Rutas REST: estáticas o constructores tipados para las que llevan identificadores. */
export const API_ENDPOINTS = {
  // Autenticación
  AUTH_LOGIN: `${AUTH}/login/`,
  AUTH_REFRESH: `${AUTH}/refresh/`,
  AUTH_ME: `${AUTH}/me/`,
  // Administración: auditoría, IA/RAG y base documental
  AUDIT_EVENTS: `${ADMIN}/audit-events/`,
  AI_CONFIG: `${ADMIN}/ai-config/`,
  AI_CONFIG_TEST_CONNECTION: `${ADMIN}/ai-config/test-connection/`,
  DOCUMENT_VERSIONS: `${DOCUMENT_VERSIONS}/`,
  DOCUMENT_VERSION_UPLOAD: `${DOCUMENT_VERSIONS}/upload/`,
  DOCUMENT_VERSION_PREVIEW: (id: number) => `${DOCUMENT_VERSIONS}/${id}/preview/`,
  DOCUMENT_VERSION_ACTION: (id: number, action: DocumentAction) => `${DOCUMENT_VERSIONS}/${id}/${action}/`,
  // Matriz 5x5 y catálogo de activos
  MATRIX_ACTIVE: 'matrices/active/',
  MATRIX_PUBLISH: `${ADMIN}/matrices/publish/`,
  ASSETS: 'assets/',
  ASSET: (id: number) => `assets/${id}/`,
  ASSET_TYPES: 'asset-types/',
  // Usuarios, roles y permisos
  USERS: `${ADMIN}/users/`,
  USER: (id: number) => `${ADMIN}/users/${id}/`,
  ROLES: `${ADMIN}/roles/`,
  ROLE: (id: number) => `${ADMIN}/roles/${id}/`,
  PERMISSIONS: `${ADMIN}/permissions/`,
  // Incidencias
  INCIDENTS: `${INCIDENTS}/`,
  INCIDENT: (id: number) => `${INCIDENTS}/${id}/`,
  INCIDENT_OPERATIONAL_GUIDANCE: (id: number) => `${INCIDENTS}/${id}/operational-guidance/`,
  INCIDENT_ORIENTATION_FEEDBACK: (id: number) => `${INCIDENTS}/${id}/orientation-feedback/`,
  INCIDENT_START_ATTENTION: (id: number) => `${INCIDENTS}/${id}/start-attention/`,
  INCIDENT_ATTENTION: (id: number) => `${INCIDENTS}/${id}/attention/`,
  INCIDENT_EVIDENCE_DOWNLOAD: (incidentId: number, evidenceId: number) => `${INCIDENTS}/${incidentId}/evidences/${evidenceId}/download/`,
  INCIDENT_RETRY_STRATEGIC: (id: number) => `${INCIDENTS}/${id}/retry-strategic/`,
  // Gobierno de riesgos
  RISK_VERSIONS: `${RISK_VERSIONS}/`,
  RISK_VERSION: (id: number) => `${RISK_VERSIONS}/${id}/`,
  RISK_VERSION_REMOVE_INCIDENT: (id: number, analysisId: number) => `${RISK_VERSIONS}/${id}/incidents/${analysisId}/remove/`,
  RISK_VERSION_RESTORE_INCIDENT: (id: number, analysisId: number) => `${RISK_VERSIONS}/${id}/incidents/${analysisId}/restore/`,
  RISK_VERSION_CONFIRM_GROUPING: (id: number) => `${RISK_VERSIONS}/${id}/confirm-grouping/`,
  RISK_VERSION_EVALUATE: (id: number) => `${RISK_VERSIONS}/${id}/evaluate/`,
  RISK_VERSION_DECISION: (id: number) => `${RISK_VERSIONS}/${id}/decision/`,
  RISK_DASHBOARD: 'risks/dashboard/',
} as const

/** Rutas que nunca disparan la renovación del token ante un 401 (credenciales o refresh inválidos). */
export const AUTH_ENDPOINTS_WITHOUT_REFRESH: readonly string[] = [API_ENDPOINTS.AUTH_LOGIN, API_ENDPOINTS.AUTH_REFRESH]
