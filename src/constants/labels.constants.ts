import type { AuditTargetKind, DocumentPurpose, EmbeddingProvider, IncidentStatus, LlmProvider, RiskLevelCode, RiskValidationStatus, RoleCode } from '@/types/domain.types'
import type { AuditAction } from '@/constants/audit.constants'
import { PERMISSIONS } from '@/constants/rbac.constants'

export const ROLE_LABEL: Record<RoleCode, string> = {
  REPORTANTE: 'Reportante',
  ANALISTA: 'Analista',
  ADMIN: 'Administrador',
}

export const INCIDENT_STATUS_LABEL: Record<IncidentStatus, string> = {
  REGISTRADA: 'Registrada',
  EN_ANALISIS: 'En análisis',
  PENDIENTE_ATENCION_HUMANA: 'Pendiente de atención',
  EN_ATENCION: 'En atención',
  CERRADA: 'Cerrada',
}

export const RISK_VALIDATION_LABEL: Record<RiskValidationStatus, string> = {
  PENDIENTE: 'Pendiente',
  VALIDADA: 'Validada',
  CORREGIDA: 'Corregida',
  RECHAZADA: 'Rechazada',
}

export const RISK_LEVEL_LABEL: Record<RiskLevelCode, string> = {
  BAJO: 'Bajo',
  MEDIO: 'Medio',
  ALTO: 'Alto',
  CRITICO: 'Crítico',
}

/** Catálogo de permisos agrupado por módulo (etiquetas de figma/src/data.ts PERMS). */
export const PERMISSION_GROUPS: { module: string; items: { code: string; label: string }[] }[] = [
  {
    module: 'Incidencias',
    items: [
      { code: PERMISSIONS.INCIDENT_CREATE, label: 'Registrar incidencias' },
      { code: PERMISSIONS.INCIDENT_VIEW_OWN, label: 'Ver incidencias propias' },
      { code: PERMISSIONS.INCIDENT_VIEW_ALL, label: 'Ver todas las incidencias' },
      { code: PERMISSIONS.INCIDENT_CLOSE_OWN_BY_FEEDBACK, label: 'Cerrar propias mediante feedback' },
    ],
  },
  {
    module: 'Atención de incidencias',
    items: [
      { code: PERMISSIONS.ATTENTION_VIEW_QUEUE, label: 'Ver cola de atención' },
      { code: PERMISSIONS.ATTENTION_ATTEND, label: 'Atender y cerrar incidencias' },
    ],
  },
  {
    module: 'Riesgos',
    items: [
      { code: PERMISSIONS.RISK_REVIEW_GROUPING, label: 'Revisar agrupaciones' },
      { code: PERMISSIONS.RISK_EVALUATE, label: 'Evaluar riesgos' },
      { code: PERMISSIONS.RISK_VALIDATE, label: 'Validar, corregir o rechazar' },
      { code: PERMISSIONS.RISK_QUERY, label: 'Consultar riesgos e indicadores' },
    ],
  },
  {
    module: 'Administración',
    items: [
      { code: PERMISSIONS.ASSET_ADMIN, label: 'Administrar activos' },
      { code: PERMISSIONS.DOCUMENT_ADMIN, label: 'Administrar documentos' },
      { code: PERMISSIONS.MATRIX_ADMIN, label: 'Administrar matriz' },
      { code: PERMISSIONS.USER_ADMIN, label: 'Administrar usuarios' },
      { code: PERMISSIONS.ROLE_ADMIN, label: 'Administrar roles y permisos' },
    ],
  },
]

export const DOCUMENT_PURPOSE_LABEL: Record<DocumentPurpose, string> = {
  OPERATIVA: 'Operativa (orientación al reportante)',
  ESTRATEGICA: 'Estratégica (análisis de riesgos)',
  AMBAS: 'Ambas finalidades',
}

/** Campos de contenido de VERSION_RIESGO mostrados en el historial y el comparador de versiones. */
export const RISK_VERSION_FIELDS: { key: 'title' | 'description' | 'threat' | 'vulnerability' | 'consequence' | 'recommendation'; label: string; wide?: boolean }[] = [
  { key: 'title', label: 'Riesgo' },
  { key: 'description', label: 'Descripción', wide: true },
  { key: 'threat', label: 'Amenaza' },
  { key: 'vulnerability', label: 'Vulnerabilidad' },
  { key: 'consequence', label: 'Consecuencia' },
  { key: 'recommendation', label: 'Recomendación', wide: true },
]

/** Etiquetas de EVENTO_AUDITORIA.accion (catálogo en audit.constants.ts; un código desconocido se muestra tal cual). */
export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  INICIO_SESION: 'Inicio de sesión',
  INICIO_SESION_FALLIDO: 'Inicio de sesión fallido',
  CREAR_USUARIO: 'Creación de usuario',
  ACTUALIZAR_USUARIO: 'Actualización de usuario',
  ACTIVAR_USUARIO: 'Activación de usuario',
  DESACTIVAR_USUARIO: 'Desactivación de usuario',
  CAMBIAR_ROL_USUARIO: 'Cambio de rol de usuario',
  CREAR_ROL: 'Creación de rol',
  ACTUALIZAR_ROL: 'Actualización de rol',
  CREAR_ACTIVO: 'Creación de activo',
  ACTUALIZAR_ACTIVO: 'Actualización de activo',
  ACTIVAR_ACTIVO: 'Activación de activo',
  DESACTIVAR_ACTIVO: 'Desactivación de activo',
  ACTUALIZAR_CONFIG_IA_RAG: 'Actualización de configuración IA/RAG',
  PROBAR_CONEXION_IA: 'Prueba de conexión IA',
  CARGAR_VERSION_DOCUMENTO: 'Carga de documento',
  AUTORIZAR_ACTIVAR_VERSION_DOCUMENTO: 'Autorización de documento',
  ACTIVAR_VERSION_DOCUMENTO: 'Activación de documento',
  DESACTIVAR_VERSION_DOCUMENTO: 'Desactivación de documento',
  REPROCESAR_VERSION_DOCUMENTO: 'Reproceso de documento',
  REINDEXAR_VERSION_DOCUMENTO: 'Reindexación de documento',
  PUBLICAR_CONFIGURACION_MATRIZ: 'Publicación de matriz',
  REGISTRAR_INCIDENCIA: 'Registro de incidencia',
  CONFIRMAR_ORIENTACION_OPERATIVA: 'Respuesta a la orientación',
  INICIAR_ATENCION_HUMANA: 'Inicio de atención N2',
  REGISTRAR_AVANCE_ATENCION: 'Avance de atención N2',
  CERRAR_ATENCION_HUMANA: 'Cierre por atención N2',
  REINTENTAR_ANALISIS_ESTRATEGICO: 'Reintento de análisis de riesgo',
  ANALIZAR_RIESGO_INCIDENCIA: 'Análisis de riesgo (IA)',
  RETIRAR_INCIDENCIA_AGRUPACION: 'Retiro de incidencia de agrupación',
  RESTAURAR_INCIDENCIA_AGRUPACION: 'Restauración de incidencia en agrupación',
  CONFIRMAR_AGRUPACION_RIESGO: 'Confirmación de agrupación',
  EVALUAR_RIESGO: 'Evaluación en matriz 5×5',
  DECIDIR_VERSION_RIESGO: 'Decisión sobre versión de riesgo',
}

export const AUDIT_TARGET_LABEL: Record<AuditTargetKind, string> = {
  INCIDENCIA: 'Incidencia',
  VERSION_RIESGO: 'Versión de riesgo',
  VERSION_DOCUMENTO: 'Versión de documento',
  MATRIZ: 'Matriz',
  ACTIVO: 'Activo',
  USUARIO: 'Usuario',
  ROL: 'Rol',
}

export const LLM_PROVIDER_LABEL: Record<LlmProvider, string> = {
  GEMINI: 'Google Gemini',
  OPENAI: 'OpenAI',
  HUGGINGFACE_LOCAL: 'Hugging Face (local)',
}

export const EMBEDDING_PROVIDER_LABEL: Record<EmbeddingProvider, string> = {
  SENTENCE_TRANSFORMERS: 'Sentence Transformers (local)',
  GEMINI: 'Google Gemini',
  OPENAI: 'OpenAI',
}
