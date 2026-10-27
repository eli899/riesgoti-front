/** Intervalos de polling y tiempos de interfaz (constants-no-magic-strings). */

/** Polling automático de los Custom Hooks mientras un proceso asíncrono del backend sigue en curso. */
export const POLLING_INTERVALS_MS = {
  /** VERSION_DOCUMENTO en PROCESANDO (ingesta PDF -> Markdown -> FAISS). */
  DOCUMENT_PROCESSING: 3000,
  /** Rama operativa (TAREA_IA OPERATIVA) hasta que la orientación quede lista. */
  OPERATIONAL_GUIDANCE: 2500,
  /** Rama estratégica (TAREA_IA ESTRATEGICA) en curso. */
  STRATEGIC_ANALYSIS: 5000,
  /** Lista del reportante con incidencias aún en análisis automático. */
  REPORTER_LIST: 5000,
  /** Cola de atención humana N2. */
  SUPPORT_QUEUE: 15000,
} as const

export const UI_TIMINGS = {
  /** Espera antes de enfocar el primer control de un diálogo recién montado. */
  DIALOG_FOCUS_DELAY_MS: 10,
  /** Espera antes de liberar la URL temporal de una descarga. */
  OBJECT_URL_REVOKE_MS: 1000,
} as const

export const TIME_UNITS = {
  MS_PER_HOUR: 3_600_000,
  MS_PER_DAY: 86_400_000,
  HOURS_PER_DAY: 24,
} as const
