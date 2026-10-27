/**
 * Límites y mensajes de validación de formularios (Zod). Los límites son espejo de los Input Serializers DRF y de las
 * columnas de bd.sql (back/apps/<app>/constants.py y column_max_length en back/config/constants.py); los mensajes
 * interpolan el límite para no repetir el número a mano.
 */

export const BYTES_PER_MB = 1024 * 1024

/** Longitudes (caracteres) y rangos numéricos por entidad. */
export const FIELD_LIMITS = {
  // Sesión y USUARIO
  EMAIL_MAX: 150,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
  PERSON_NAME_MAX: 100,
  // ROL
  ROLE_CODE_MIN: 2,
  ROLE_CODE_MAX: 50,
  ROLE_NAME_MIN: 3,
  ROLE_NAME_MAX: 100,
  // ACTIVO
  ASSET_CODE_MIN: 2,
  ASSET_CODE_MAX: 50,
  ASSET_NAME_MIN: 3,
  ASSET_NAME_MAX: 150,
  ASSET_CRITICALITY_MIN: 1,
  ASSET_CRITICALITY_MAX: 4,
  // CONFIGURACION_MATRIZ
  MATRIX_NAME_MIN: 3,
  MATRIX_NAME_MAX: 100,
  // DOCUMENTO / VERSION_DOCUMENTO
  DOCUMENT_CODE_MIN: 2,
  DOCUMENT_CODE_MAX: 50,
  DOCUMENT_TITLE_MIN: 5,
  DOCUMENT_TITLE_MAX: 255,
  DOCUMENT_VERSION_MIN: 1,
  DOCUMENT_VERSION_MAX: 50,
  // INCIDENCIA y ATENCION_INCIDENCIA
  INCIDENT_TITLE_MIN: 5,
  INCIDENT_TITLE_MAX: 255,
  INCIDENT_DESCRIPTION_MIN: 20,
  INCIDENT_ASSET_TEXT_MIN: 2,
  INCIDENT_ASSET_TEXT_MAX: 255,
  ATTENTION_TEXT_MIN: 10,
  ATTENTION_TEXT_MAX: 10000,
  // Gobierno de riesgos
  RISK_JUSTIFICATION_MIN: 15,
  RISK_OBSERVATION_MIN: 10,
  RISK_ASSET_CHANGE_JUSTIFICATION_MAX: 2000,
  RISK_TITLE_MAX: 255,
  // CONFIGURACION_IA_RAG
  AI_MODEL_MIN: 2,
  AI_CHUNK_SIZE_MIN: 256,
  AI_CHUNK_SIZE_MAX: 2048,
  AI_CHUNK_OVERLAP_MIN: 0,
  AI_CHUNK_OVERLAP_MAX: 512,
  AI_TOP_K_MIN: 1,
  AI_TOP_K_MAX: 15,
  AI_SIMILARITY_MIN: 0,
  AI_SIMILARITY_MAX: 1,
} as const

/** Archivos adjuntos (espejo de MAX_PDF_UPLOAD_BYTES, MAX_EVIDENCE_BYTES y MAX_EVIDENCES_PER_INCIDENT del backend). */
export const FILE_LIMITS = {
  PDF_MAX_BYTES: 25 * BYTES_PER_MB,
  EVIDENCE_MAX_BYTES: 10 * BYTES_PER_MB,
  EVIDENCES_PER_INCIDENT_MAX: 5,
  EVIDENCE_EXTENSIONS: ['.png', '.jpg', '.jpeg', '.pdf', '.log', '.txt'],
  PDF_EXTENSION: '.pdf',
  PDF_MIME_TYPE: 'application/pdf',
} as const

const L = FIELD_LIMITS
const toMb = (bytes: number) => bytes / BYTES_PER_MB

/** Mensajes de error de los esquemas Zod, agrupados por formulario. */
export const VALIDATION_MESSAGES = {
  AUTH: {
    EMAIL_REQUIRED: 'Ingrese su correo institucional',
    EMAIL_INVALID: 'Correo electrónico inválido',
    PASSWORD_REQUIRED: 'Ingrese su contraseña',
  },
  USER: {
    FIRST_NAME_REQUIRED: 'Ingrese los nombres',
    LAST_NAME_REQUIRED: 'Ingrese los apellidos',
    EMAIL_INVALID: 'Ingrese un correo válido',
    ROLE_REQUIRED: 'Seleccione un rol',
    PASSWORD_MIN: `La contraseña debe tener al menos ${L.PASSWORD_MIN} caracteres`,
  },
  ROLE: {
    CODE_REQUIRED: 'Ingrese un código (ej. AUDITOR_TI)',
    CODE_FORMAT: 'Use MAYÚSCULAS, dígitos y guion bajo (ej. AUDITOR_TI)',
    NAME_MIN: `Ingrese un nombre de al menos ${L.ROLE_NAME_MIN} caracteres`,
    SOD_ADMIN: 'Segregación de Funciones: el rol ADMIN no puede recibir permisos de evaluación o validación de riesgos',
    ADMIN_REQUIRED: 'El rol ADMIN debe conservar la administración de usuarios y de roles',
    ADMIN_INACTIVE: 'El rol ADMIN no puede desactivarse',
    SOD_COMBINATION: 'Segregación de Funciones: un mismo rol no puede combinar permisos de administración con permisos de evaluación o decisión de riesgos',
  },
  ASSET: {
    TYPE_REQUIRED: 'Seleccione el tipo de activo',
    CODE_REQUIRED: 'Ingrese un código (ej. ACT-007)',
    CODE_MAX: `Máximo ${L.ASSET_CODE_MAX} caracteres`,
    NAME_MIN: `Ingrese un nombre de al menos ${L.ASSET_NAME_MIN} caracteres`,
    NAME_MAX: `Máximo ${L.ASSET_NAME_MAX} caracteres`,
  },
  MATRIX: {
    NAME_MIN: `Ingresa un nombre de al menos ${L.MATRIX_NAME_MIN} caracteres.`,
  },
  DOCUMENT: {
    CODE_REQUIRED: 'El código del documento es obligatorio (ej. POL-SGSI-01)',
    CODE_MAX: `Máximo ${L.DOCUMENT_CODE_MAX} caracteres`,
    CODE_FORMAT: 'Use letras, dígitos, punto, guion o guion bajo (ej. POL-SGSI-01)',
    TITLE_MIN: `El título debe tener al menos ${L.DOCUMENT_TITLE_MIN} caracteres`,
    VERSION_REQUIRED: 'La versión es obligatoria (ej. v1.0)',
    FILE_REQUIRED: 'Debe seleccionar un archivo PDF',
    FILE_TYPE: 'Solo se permiten archivos .pdf',
    FILE_SIZE: `El archivo PDF no debe superar ${toMb(FILE_LIMITS.PDF_MAX_BYTES)} MB`,
  },
  INCIDENT: {
    TITLE_MIN: `El título debe describir brevemente el problema (mínimo ${L.INCIDENT_TITLE_MIN} caracteres)`,
    DESCRIPTION_MIN: `Describa qué ocurrió con al menos ${L.INCIDENT_DESCRIPTION_MIN} caracteres`,
    FILE_INVALID: 'Archivo inválido',
    EVIDENCES_MAX: `Máximo ${FILE_LIMITS.EVIDENCES_PER_INCIDENT_MAX} evidencias por incidencia`,
    EVIDENCE_FORMAT: 'Formatos permitidos: png, jpg, pdf, log, txt',
    EVIDENCE_SIZE: `Cada evidencia debe pesar como máximo ${toMb(FILE_LIMITS.EVIDENCE_MAX_BYTES)} MB`,
    ASSET_REQUIRED: 'Seleccione un activo del catálogo o especifique el recurso afectado en texto libre',
  },
  ATTENTION: {
    ACTIONS_MIN: `Para cerrar el caso debe detallar las acciones realizadas (mínimo ${L.ATTENTION_TEXT_MIN} caracteres)`,
    RESOLUTION_MIN: `Para cerrar el caso debe registrar la nota de resolución (mínimo ${L.ATTENTION_TEXT_MIN} caracteres)`,
  },
  RISK: {
    REMOVAL_REASON_MIN: `Explique el motivo por el cual retira este falso positivo (mínimo ${L.RISK_OBSERVATION_MIN} caracteres)`,
    ASSET_REQUIRED: 'Seleccione el activo afectado',
    ASSET_CHANGE_JUSTIFICATION_MIN: `El activo elegido difiere del reportado en las incidencias: justifique el cambio (mínimo ${L.RISK_OBSERVATION_MIN} caracteres)`,
    PROBABILITY_REQUIRED: 'Seleccione un nivel de probabilidad (1 a 5)',
    IMPACT_REQUIRED: 'Seleccione un nivel de impacto (1 a 5)',
    JUSTIFICATION_MIN: `La justificación de evaluación en matriz debe tener al menos ${L.RISK_JUSTIFICATION_MIN} caracteres`,
    DECISION_ASSET_REQUIRED: 'Debe confirmar el activo afectado antes de validar el riesgo',
    DECISION_GROUPING_REQUIRED: 'Debe confirmar la revisión de la agrupación de incidencias',
    DECISION_PROBABILITY_REQUIRED: 'Seleccione un nivel de probabilidad (1 a 5) en la matriz',
    DECISION_IMPACT_REQUIRED: 'Seleccione un nivel de impacto (1 a 5) en la matriz',
    NO_SOURCES_JUSTIFICATION_MIN: `Al no existir fuentes documentales estratégicas citadas, debe justificar la validación sin fuentes (mínimo ${L.RISK_JUSTIFICATION_MIN} caracteres)`,
    VALIDATION_OBSERVATION_MIN: `Registre una observación de la validación (mínimo ${L.RISK_OBSERVATION_MIN} caracteres)`,
    CORRECTION_OBSERVATION_MIN: `Para corregir la propuesta debe registrar una observación (mínimo ${L.RISK_OBSERVATION_MIN} caracteres)`,
    CORRECTION_FIELD_REQUIRED: 'Indique al menos un campo corregido para la nueva versión',
    REJECTION_REASON_MIN: `Debe registrar el motivo del rechazo de la propuesta (mínimo ${L.RISK_OBSERVATION_MIN} caracteres)`,
    CORRECTION_UNCHANGED: 'Modifique al menos un campo del contenido para crear la nueva versión',
  },
  AI_CONFIG: {
    LLM_MODEL_REQUIRED: 'Seleccione o ingrese un modelo LLM válido',
    URL_INVALID: 'URL inválida',
    EMBEDDING_MODEL_REQUIRED: 'El modelo de embedding es obligatorio',
    CHUNK_SIZE_REQUIRED: 'Ingrese el tamaño del fragmento',
    CHUNK_SIZE_MIN: `Mínimo ${L.AI_CHUNK_SIZE_MIN} tokens`,
    CHUNK_SIZE_MAX: `Máximo ${L.AI_CHUNK_SIZE_MAX} tokens`,
    CHUNK_OVERLAP_REQUIRED: 'Ingrese el solapamiento',
    CHUNK_OVERLAP_MIN: `Mínimo ${L.AI_CHUNK_OVERLAP_MIN} tokens`,
    CHUNK_OVERLAP_MAX: `Máximo ${L.AI_CHUNK_OVERLAP_MAX} tokens`,
    TOP_K_REQUIRED: 'Ingrese la cantidad de fragmentos',
    TOP_K_MIN: `Mínimo ${L.AI_TOP_K_MIN} fragmento`,
    TOP_K_MAX: `Máximo ${L.AI_TOP_K_MAX} fragmentos`,
    SIMILARITY_REQUIRED: 'Ingrese el umbral de similitud',
    SIMILARITY_MIN: `Mínimo ${L.AI_SIMILARITY_MIN.toFixed(2)}`,
    SIMILARITY_MAX: `Máximo ${L.AI_SIMILARITY_MAX.toFixed(2)}`,
    CHUNK_OVERLAP_RATIO: 'El solapamiento (chunk_overlap) debe ser estrictamente menor a la mitad del chunk_size',
  },
} as const
