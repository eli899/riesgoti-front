/** Límites de presentación, modos e identificadores de interfaz (constants-no-magic-strings). */

/** Escala de la matriz de evaluación 5x5 (CELDA_MATRIZ): probabilidad e impacto de 1 a 5. */
export const RISK_MATRIX = {
  MIN_LEVEL: 1,
  MAX_LEVEL: 5,
} as const

/** Cantidad de elementos que muestran los tableros. */
export const DASHBOARD_LIMITS = {
  TOP_ITEMS: 5,
  RECENT_INCIDENTS: 4,
} as const

/** Serie diaria del resumen del analista. */
export const ANALYST_SUMMARY_SERIES_DAYS = {
  MIN: 30,
  MAX: 90,
} as const

/** Valor del filtro «sin restricción» en selectores y chips. */
export const FILTER_ALL = 'all'
export type FilterAll = typeof FILTER_ALL

/** Modos del listado de atención: cola N2 o todas las incidencias. */
export const SUPPORT_VIEW_MODES = {
  QUEUE: 'queue',
  ALL: FILTER_ALL,
} as const

export type SupportViewMode = (typeof SUPPORT_VIEW_MODES)[keyof typeof SUPPORT_VIEW_MODES]

/** Pestañas de la vista de matriz del Administrador. */
export const MATRIX_TABS = {
  MATRIX: 'matrix',
  PROBABILITY: 'probability',
  IMPACT: 'impact',
} as const

export type MatrixTab = (typeof MATRIX_TABS)[keyof typeof MATRIX_TABS]

/** Claves de error de formulario y de respuesta DRF. */
export const FORM_ERROR_KEYS = {
  /** Error general del formulario (React Hook Form). */
  ROOT_SERVER: 'root.server',
  /** Mensaje general de DRF (APIException). */
  DETAIL: 'detail',
  /** Errores de validación no asociados a un campo (DRF). */
  NON_FIELD_ERRORS: 'non_field_errors',
} as const
