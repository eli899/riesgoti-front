import type { AuditTargetKind, DocumentPurpose, IncidentStatus, RiskLevelCode, RiskValidationStatus, RoleCode } from '@/types/domain.types'

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
      { code: 'incidencia.crear', label: 'Registrar incidencias' },
      { code: 'incidencia.ver_propias', label: 'Ver incidencias propias' },
      { code: 'incidencia.ver_todas', label: 'Ver todas las incidencias' },
      { code: 'incidencia.cerrar_propias_por_feedback', label: 'Cerrar propias mediante feedback' },
    ],
  },
  {
    module: 'Atención de incidencias',
    items: [
      { code: 'atencion.ver_cola', label: 'Ver cola de atención' },
      { code: 'atencion.atender', label: 'Atender y cerrar incidencias' },
    ],
  },
  {
    module: 'Riesgos',
    items: [
      { code: 'riesgo.revisar_agrupacion', label: 'Revisar agrupaciones' },
      { code: 'riesgo.evaluar', label: 'Evaluar riesgos' },
      { code: 'riesgo.validar', label: 'Validar, corregir o rechazar' },
      { code: 'riesgo.consultar', label: 'Consultar riesgos e indicadores' },
    ],
  },
  {
    module: 'Administración',
    items: [
      { code: 'activo.administrar', label: 'Administrar activos' },
      { code: 'documento.administrar', label: 'Administrar documentos' },
      { code: 'matriz.administrar', label: 'Administrar matriz' },
      { code: 'usuario.administrar', label: 'Administrar usuarios' },
      { code: 'rol.administrar', label: 'Administrar roles y permisos' },
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

/** Acciones registradas en EVENTO_AUDITORIA por los servicios del backend (el código se muestra si no hay etiqueta). */
export const AUDIT_ACTION_LABEL: Record<string, string> = {
  INICIO_SESION: 'Inicio de sesión',
  INICIO_SESION_FALLIDO: 'Inicio de sesión fallido',
  CREAR_USUARIO: 'Creación de usuario',
  CREAR_ROL: 'Creación de rol',
  ACTUALIZAR_ROL: 'Actualización de rol',
  CREAR_ACTIVO: 'Creación de activo',
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
