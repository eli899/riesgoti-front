/**
 * Fuente única de los valores de dominio persistidos en bd.sql y expuestos por la API (constants-no-magic-strings).
 * Los valores son idénticos en la red y en el dominio: api.types.ts y domain.types.ts derivan de aquí sus tipos.
 * Espejo de los StrEnum del backend (back/apps/<app>/constants.py).
 */

type ValueOf<T> = T[keyof T]

/** HISTORIAL_ESTADO_INCIDENCIA.estado */
export const INCIDENT_STATUS = {
  REGISTRADA: 'REGISTRADA',
  EN_ANALISIS: 'EN_ANALISIS',
  PENDIENTE_ATENCION_HUMANA: 'PENDIENTE_ATENCION_HUMANA',
  EN_ATENCION: 'EN_ATENCION',
  CERRADA: 'CERRADA',
} as const

export type IncidentStatus = ValueOf<typeof INCIDENT_STATUS>

/** VERSION_DOCUMENTO.procesamiento */
export const DOCUMENT_PROCESSING_STATUS = {
  PROCESANDO: 'PROCESANDO',
  ERROR: 'ERROR',
  PENDIENTE_AUTORIZACION: 'PENDIENTE_AUTORIZACION',
  AUTORIZADO: 'AUTORIZADO',
} as const

export type DocumentProcessingStatus = ValueOf<typeof DOCUMENT_PROCESSING_STATUS>

/** VERSION_DOCUMENTO.finalidad */
export const DOCUMENT_PURPOSE = {
  OPERATIVA: 'OPERATIVA',
  ESTRATEGICA: 'ESTRATEGICA',
  AMBAS: 'AMBAS',
} as const

export type DocumentPurpose = ValueOf<typeof DOCUMENT_PURPOSE>

/** DECISION_RIESGO.accion */
export const RISK_DECISION_ACTION = {
  VALIDADA: 'VALIDADA',
  CORREGIDA: 'CORREGIDA',
  RECHAZADA: 'RECHAZADA',
} as const

export type RiskDecisionAction = ValueOf<typeof RISK_DECISION_ACTION>

/** VERSION_RIESGO.estado: 'PENDIENTE' mientras no exista fila en DECISION_RIESGO. */
export const RISK_VALIDATION_STATUS = {
  PENDIENTE: 'PENDIENTE',
  ...RISK_DECISION_ACTION,
} as const

export type RiskValidationStatus = ValueOf<typeof RISK_VALIDATION_STATUS>

/** VERSION_RIESGO.origen */
export const RISK_VERSION_ORIGIN = {
  IA: 'IA',
  ANALISTA: 'ANALISTA',
} as const

export type RiskVersionOrigin = ValueOf<typeof RISK_VERSION_ORIGIN>

/** NIVEL_RIESGO.codigo, en orden ascendente de severidad. */
export const RISK_LEVEL = {
  BAJO: 'BAJO',
  MEDIO: 'MEDIO',
  ALTO: 'ALTO',
  CRITICO: 'CRITICO',
} as const

export type RiskLevelCode = ValueOf<typeof RISK_LEVEL>

export const RISK_LEVELS_ASCENDING: readonly RiskLevelCode[] = [RISK_LEVEL.BAJO, RISK_LEVEL.MEDIO, RISK_LEVEL.ALTO, RISK_LEVEL.CRITICO]

/** Niveles que el tablero agrupa como «alto o crítico». */
export const RISK_LEVELS_HIGH_OR_CRITICAL: readonly RiskLevelCode[] = [RISK_LEVEL.ALTO, RISK_LEVEL.CRITICO]

/** TAREA_IA.rama */
export const AI_TASK_BRANCH = {
  OPERATIVA: 'OPERATIVA',
  ESTRATEGICA: 'ESTRATEGICA',
} as const

export type AITaskBranch = ValueOf<typeof AI_TASK_BRANCH>

/** TAREA_IA.estado */
export const AI_TASK_STATUS = {
  PENDIENTE: 'PENDIENTE',
  PROCESANDO: 'PROCESANDO',
  COMPLETADA: 'COMPLETADA',
  ERROR: 'ERROR',
} as const

export type AITaskStatus = ValueOf<typeof AI_TASK_STATUS>

/** ORIENTACION_OPERATIVA.tipo */
export const GUIDANCE_TYPE = {
  SUGERENCIA: 'SUGERENCIA',
  SENSIBLE: 'SENSIBLE',
  SIN_RESPALDO: 'SIN_RESPALDO',
} as const

export type GuidanceType = ValueOf<typeof GUIDANCE_TYPE>

/** RESPUESTA_ORIENTACION.resultado */
export const GUIDANCE_RESULT = {
  FUNCIONO: 'FUNCIONO',
  NO_FUNCIONO: 'NO_FUNCIONO',
} as const

export type GuidanceResult = ValueOf<typeof GUIDANCE_RESULT>

/** VERSION_INCIDENCIA.estado */
export const INCIDENT_LINK_STATUS = {
  SUGERIDA: 'SUGERIDA',
  CONFIRMADA: 'CONFIRMADA',
  RETIRADA: 'RETIRADA',
} as const

export type IncidentLinkStatus = ValueOf<typeof INCIDENT_LINK_STATUS>

/** CONFIGURACION_IA_RAG.proveedor_llm */
export const LLM_PROVIDER = {
  OPENAI: 'OPENAI',
  GEMINI: 'GEMINI',
  HUGGINGFACE_LOCAL: 'HUGGINGFACE_LOCAL',
} as const

export type LlmProvider = ValueOf<typeof LLM_PROVIDER>

/** CONFIGURACION_IA_RAG.proveedor_embedding */
export const EMBEDDING_PROVIDER = {
  OPENAI: 'OPENAI',
  GEMINI: 'GEMINI',
  SENTENCE_TRANSFORMERS: 'SENTENCE_TRANSFORMERS',
} as const

export type EmbeddingProvider = ValueOf<typeof EMBEDDING_PROVIDER>

/** Categoría del registro de riesgos (derivada en el mapper a partir del estado de la última versión). */
export const RISK_REGISTRY_CATEGORY = {
  VALIDADO: 'VALIDADO',
  PENDIENTE: 'PENDIENTE',
  RECHAZADO: 'RECHAZADO',
} as const

export type RiskRegistryCategory = ValueOf<typeof RISK_REGISTRY_CATEGORY>

/** Entidades enlazadas desde EVENTO_AUDITORIA. */
export const AUDIT_TARGET_KIND = {
  INCIDENCIA: 'INCIDENCIA',
  VERSION_RIESGO: 'VERSION_RIESGO',
  VERSION_DOCUMENTO: 'VERSION_DOCUMENTO',
  MATRIZ: 'MATRIZ',
  ACTIVO: 'ACTIVO',
  USUARIO: 'USUARIO',
  ROL: 'ROL',
} as const

export type AuditTargetKind = ValueOf<typeof AUDIT_TARGET_KIND>

/** Parámetro `bandeja` de GET /risk-versions/. Espejo de BandejaRiesgo (back/apps/risks/constants.py). */
export const RISK_INBOXES = {
  NEW: 'nuevas',
  PENDING_REVIEW: 'pendientes_revision',
  REJECTED: 'rechazadas',
  DECIDED: 'decididas',
} as const

export type RiskInbox = ValueOf<typeof RISK_INBOXES>

/** Parámetro `bandeja` de GET /incidents/. Espejo de BandejaIncidencia (back/apps/incidents/constants.py). */
export const INCIDENT_INBOXES = {
  ATTENTION: 'atencion',
} as const

export type IncidentInbox = ValueOf<typeof INCIDENT_INBOXES>

// ---------------------------------------------------------------------------
// Agrupaciones con significado de negocio
// ---------------------------------------------------------------------------

/** Tarea IA todavía en curso (dispara el polling). */
export const AI_TASK_RUNNING_STATUSES: readonly AITaskStatus[] = [AI_TASK_STATUS.PENDIENTE, AI_TASK_STATUS.PROCESANDO]

/** Incidencia todavía en la etapa automática (registro y orientación IA). */
export const INCIDENT_AUTOMATED_STATUSES: readonly IncidentStatus[] = [INCIDENT_STATUS.REGISTRADA, INCIDENT_STATUS.EN_ANALISIS]

/** Incidencia en la cola de atención humana N2. */
export const INCIDENT_HUMAN_QUEUE_STATUSES: readonly IncidentStatus[] = [
  INCIDENT_STATUS.PENDIENTE_ATENCION_HUMANA,
  INCIDENT_STATUS.EN_ATENCION,
]

/** Decisiones que exigen observación (rechazo o corrección). */
export const RISK_DECISIONS_REQUIRING_OBSERVATION: readonly RiskDecisionAction[] = [
  RISK_DECISION_ACTION.RECHAZADA,
  RISK_DECISION_ACTION.CORREGIDA,
]

/** Estado visible de una versión documental: el procesamiento, salvo AUTORIZADO, que se desdobla según `activa`. */
export const DOCUMENT_DISPLAY_STATE = {
  PROCESANDO: DOCUMENT_PROCESSING_STATUS.PROCESANDO,
  ERROR: DOCUMENT_PROCESSING_STATUS.ERROR,
  PENDIENTE_AUTORIZACION: DOCUMENT_PROCESSING_STATUS.PENDIENTE_AUTORIZACION,
  DISPONIBLE: 'DISPONIBLE',
  INACTIVO: 'INACTIVO',
} as const

export type DocumentDisplayState = ValueOf<typeof DOCUMENT_DISPLAY_STATE>

