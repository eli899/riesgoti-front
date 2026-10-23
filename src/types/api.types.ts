/**
 * DTOs crudos de red (snake_case).
 * Espejo exacto de los *OutputSerializer / *InputSerializer del Backend (back/apps/<app>/serializers.py).
 * Ningún componente ni página consume estos tipos: solo los servicios RTK Query y los Mappers.
 */

// ---------------------------------------------------------------------------
// Catálogos de valores persistidos en bd.sql
// ---------------------------------------------------------------------------
export type RolCodigoDto = 'REPORTANTE' | 'ANALISTA' | 'ADMIN'

/** HISTORIAL_ESTADO_INCIDENCIA.estado */
export type EstadoIncidenciaDto =
  | 'REGISTRADA'
  | 'EN_ANALISIS'
  | 'PENDIENTE_ATENCION_HUMANA'
  | 'EN_ATENCION'
  | 'CERRADA'

/** VERSION_DOCUMENTO.procesamiento */
export type ProcesamientoDocumentoDto = 'PROCESANDO' | 'ERROR' | 'PENDIENTE_AUTORIZACION' | 'AUTORIZADO'

/** VERSION_DOCUMENTO.finalidad */
export type FinalidadDocumentoDto = 'OPERATIVA' | 'ESTRATEGICA' | 'AMBAS'

/** DECISION_RIESGO.accion */
export type AccionDecisionRiesgoDto = 'VALIDADA' | 'CORREGIDA' | 'RECHAZADA'

/** VERSION_RIESGO.estado ('PENDIENTE' mientras no exista DECISION_RIESGO). */
export type EstadoVersionRiesgoDto = 'PENDIENTE' | AccionDecisionRiesgoDto

/** NIVEL_RIESGO.codigo */
export type NivelRiesgoCodigoDto = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO'

/** TAREA_IA.rama */
export type RamaTareaDto = 'OPERATIVA' | 'ESTRATEGICA'

/** TAREA_IA.estado */
export type EstadoTareaDto = 'PENDIENTE' | 'PROCESANDO' | 'COMPLETADA' | 'ERROR'

/** ORIENTACION_OPERATIVA.tipo */
export type TipoOrientacionDto = 'SUGERENCIA' | 'SENSIBLE' | 'SIN_RESPALDO'

/** RESPUESTA_ORIENTACION.resultado */
export type ResultadoOrientacionDto = 'FUNCIONO' | 'NO_FUNCIONO'

/** VERSION_INCIDENCIA.estado */
export type EstadoVinculoDto = 'SUGERIDA' | 'CONFIRMADA' | 'RETIRADA'

export type ProveedorLlmDto = 'OPENAI' | 'GEMINI' | 'HUGGINGFACE_LOCAL'
export type ProveedorEmbeddingDto = 'OPENAI' | 'GEMINI' | 'SENTENCE_TRANSFORMERS'

// ---------------------------------------------------------------------------
// Infraestructura (GET /health/ — HealthcheckOutputSerializer)
// ---------------------------------------------------------------------------
export interface HealthcheckDto {
  status: string
  service: string
  version: string
  database: string
  master_key_loaded: boolean
}

// ---------------------------------------------------------------------------
// Autenticación (POST /auth/login/, POST /auth/refresh/, GET /auth/me/)
// ---------------------------------------------------------------------------
export interface LoginRequestDto {
  correo: string
  password: string
}

/** UsuarioSesionOutputSerializer */
export interface UsuarioSesionDto {
  usuario_id: number
  correo: string
  nombres: string
  apellidos: string
  nombre_completo: string
  rol_id: number
  rol_codigo: RolCodigoDto
  rol_nombre: string
  permisos: string[]
}

/** LoginOutputSerializer */
export interface LoginResponseDto {
  access: string
  refresh: string
  user: UsuarioSesionDto
}

export interface RefreshRequestDto {
  refresh: string
}

export interface RefreshResponseDto {
  access: string
  refresh?: string
}

// ---------------------------------------------------------------------------
// Configuración IA/RAG (GET|PUT /admin/ai-config/, POST /admin/ai-config/test-connection/)
// ---------------------------------------------------------------------------
/** AIConfigInputSerializer — las API keys son write_only; vacías conservan la clave vigente. */
export interface AIConfigUpdateRequestDto {
  proveedor_llm: ProveedorLlmDto
  modelo_llm: string
  endpoint_base_llm: string | null
  api_key_llm?: string
  proveedor_embedding: ProveedorEmbeddingDto
  modelo_embedding: string
  api_key_embedding?: string
  chunk_size: number
  chunk_overlap: number
  top_k: number
  umbral_similitud: number
}

/** AIConfigOutputSerializer — jamás expone las claves cifradas, solo sus máscaras. */
export interface AIConfigDto {
  id: number
  version_configuracion: string
  proveedor_llm: ProveedorLlmDto
  modelo_llm: string
  endpoint_base_llm: string | null
  api_key_llm_mascara: string | null
  proveedor_embedding: ProveedorEmbeddingDto
  modelo_embedding: string
  api_key_embedding_mascara: string | null
  chunk_size: number
  chunk_overlap: number
  top_k: number
  umbral_similitud: number
  activa: boolean
  actualizada_por_id: number
  creado_en: string
  requiere_reindexacion_documentos: boolean
  versiones_desfasadas: { id: number; codigo: string; version: string; modelo_embedding: string | null }[]
}

/** TestConnectionInputSerializer — lo omitido se toma de la configuración activa. */
export type AIConnectionTestRequestDto = Partial<
  Pick<AIConfigUpdateRequestDto, 'proveedor_llm' | 'modelo_llm' | 'endpoint_base_llm' | 'api_key_llm' | 'proveedor_embedding' | 'modelo_embedding' | 'api_key_embedding'>
>

/** TestConnectionOutputSerializer */
export interface AIConnectionTestDto {
  llm_status: 'ok' | 'error'
  llm_provider: string
  llm_model: string
  llm_latency_ms: number | null
  llm_error: string | null
  embedding_status: 'ok' | 'error'
  embedding_provider: string
  embedding_model: string
  embedding_dimensions: number | null
  embedding_latency_ms: number | null
  embedding_error: string | null
}

// ---------------------------------------------------------------------------
// Base de conocimiento (/admin/document-versions/)
// ---------------------------------------------------------------------------
/** VersionDocumentoOutputSerializer */
export interface DocumentVersionDto {
  id: number
  documento_id: number
  codigo: string
  titulo: string
  descripcion: string | null
  version: string
  sha256: string
  procesamiento: ProcesamientoDocumentoDto
  finalidad: FinalidadDocumentoDto
  activa: boolean
  modelo_embedding: string | null
  version_segmentacion: string | null
  error_procesamiento: string | null
  total_fragmentos: number
  requiere_reindexacion: boolean
  cargada_por_id: number
  cargada_por_nombre: string
  cargada_en: string
  autorizada_por_id: number | null
  autorizada_por_nombre: string | null
  autorizada_en: string | null
  ultima_modificacion: string
}

/** FragmentoOutputSerializer */
export interface DocumentFragmentDto {
  id: number
  orden: number
  pagina_inicio: number | null
  pagina_fin: number | null
  contenido: string
}

/** DocumentPreviewOutputSerializer */
export interface DocumentPreviewDto {
  id: number
  codigo: string
  titulo: string
  version: string
  procesamiento: ProcesamientoDocumentoDto
  activa: boolean
  modelo_embedding: string | null
  version_segmentacion: string | null
  error_procesamiento: string | null
  total_fragmentos: number
  fragmentos: DocumentFragmentDto[]
}

// ---------------------------------------------------------------------------
// Activos y matriz 5x5 (/assets/, /matrices/active/, /admin/matrices/publish/)
// ---------------------------------------------------------------------------
/** ActivoOutputSerializer — criticidad INT 1..4. */
export interface AssetDto {
  id: number
  tipo_id: number
  tipo_nombre: string
  codigo: string
  nombre: string
  descripcion: string | null
  criticidad: number | null
  activo: boolean
  creado_en: string
  ultima_modificacion: string
}

export interface MatrixCriterionDto {
  valor: number
  nombre: string
  descripcion: string | null
}

export interface MatrixCellDto {
  id: number
  probabilidad: number
  impacto: number
  nivel_id: number
  nivel_codigo: NivelRiesgoCodigoDto
  nivel_orden: number
}

/** MatrizActivaOutputSerializer */
export interface MatrixConfigDto {
  id: number
  nombre: string
  version: string
  estado: string
  activa: boolean
  creada_por_id: number
  creada_por_nombre: string
  creada_en: string
  niveles: { id: number; codigo: NivelRiesgoCodigoDto; orden: number }[]
  criterios_probabilidad: MatrixCriterionDto[]
  criterios_impacto: MatrixCriterionDto[]
  celdas: MatrixCellDto[]
}

/** PublishMatrixInputSerializer — 25 celdas únicas; criterios opcionales (se clonan de la matriz activa). */
export interface MatrixPublishRequestDto {
  nombre?: string
  criterios_probabilidad?: { valor: number; nombre: string; descripcion?: string | null }[]
  criterios_impacto?: { valor: number; nombre: string; descripcion?: string | null }[]
  celdas: { probabilidad: number; impacto: number; nivel_codigo: NivelRiesgoCodigoDto }[]
}

// ---------------------------------------------------------------------------
// Catálogo de activos: escritura y tipos (POST|PATCH /assets/, GET /asset-types/)
// ---------------------------------------------------------------------------
/** TipoActivoOutputSerializer */
export interface AssetTypeDto {
  id: number
  nombre: string
  activo: boolean
}

/** ActivoInputSerializer (POST completo / PATCH parcial). Nunca se elimina: se desactiva. */
export interface AssetRequestDto {
  tipo_id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  criticidad?: number | null
  activo?: boolean
}

// ---------------------------------------------------------------------------
// Usuarios, roles y permisos (/admin/users/, /admin/roles/, /admin/permissions/)
// ---------------------------------------------------------------------------
/** UsuarioOutputSerializer — jamás expone password_hash. */
export interface UserDto {
  id: number
  nombres: string
  apellidos: string
  nombre_completo: string
  correo: string
  rol_id: number
  rol_codigo: string
  rol_nombre: string
  activo: boolean
  creado_en: string
  ultima_modificacion: string
}

/** UsuarioInputSerializer — password obligatoria solo al crear. */
export interface UserRequestDto {
  nombres?: string
  apellidos?: string
  correo?: string
  rol_id?: number
  password?: string
  activo?: boolean
}

/** RolOutputSerializer */
export interface RoleDto {
  id: number
  codigo: string
  nombre: string
  activo: boolean
  permisos: string[]
  total_usuarios: number
  creado_en: string
  ultima_modificacion: string
}

/** RolInputSerializer (POST / PUT completo). */
export interface RoleRequestDto {
  codigo: string
  nombre: string
  activo: boolean
  permisos: string[]
}

/** PermisoOutputSerializer */
export interface PermissionDto {
  id: number
  codigo: string
  descripcion: string | null
  activo: boolean
}

// ---------------------------------------------------------------------------
// Incidencias (/incidents/)
// ---------------------------------------------------------------------------
/** IncidentListOutputSerializer */
export interface IncidentDto {
  id: number
  referencia: string
  titulo: string
  descripcion: string
  activo_reportado_id: number | null
  activo_nombre: string | null
  activo_texto: string | null
  reportante_id: number
  reportante_nombre: string
  estado_actual: EstadoIncidenciaDto
  registrada_en: string
  total_evidencias: number
  orientacion_tipo: TipoOrientacionDto | null
  orientacion_resultado: ResultadoOrientacionDto | null
  tarea_operativa_estado: EstadoTareaDto | null
  tarea_estrategica_estado: EstadoTareaDto | null
  analista_nombre: string | null
}

export interface EvidenceDto {
  id: number
  nombre_original: string
  tipo_mime: string
  bytes: number
  sha256: string
  creada_en: string
}

export interface StatusHistoryDto {
  id: number
  estado: EstadoIncidenciaDto
  actor_id: number
  actor_nombre: string
  motivo: string | null
  ocurrido_en: string
}

/** AtencionIncidenciaOutputSerializer */
export interface HumanAttentionDto {
  incidencia_id: number
  analista_id: number
  analista_nombre: string
  iniciada_en: string
  acciones: string | null
  nota_resolucion: string | null
  cerrada_en: string | null
}

/** TareaIAResumenOutputSerializer */
export interface AITaskSummaryDto {
  id: number
  rama: RamaTareaDto
  intento: number
  estado: EstadoTareaDto
  error_codigo: string | null
  error_detalle: string | null
  creada_en: string
  terminada_en: string | null
}

/** IncidentListDetailOutputSerializer */
export interface IncidentDetailDto extends IncidentDto {
  evidencias: EvidenceDto[]
  historial: StatusHistoryDto[]
  atencion: HumanAttentionDto | null
  tareas_ia: { operativa: AITaskSummaryDto | null; estrategica: AITaskSummaryDto | null }
  riesgos_vinculados: {
    riesgo_id: number
    riesgo_codigo: string
    version_id: number
    version_numero: number
    estado_vinculo: EstadoVinculoDto
  }[]
}

/** Filtros de IncidentFilter (querystring). */
export interface IncidentListParamsDto {
  estado?: string
  activo_reportado_id?: number
  reportante_id?: number
  dias?: number
  q?: string
  bandeja?: 'atencion'
  ordering?: string
}

/** CitaOrientacionOutputSerializer / CitaVersionRiesgoOutputSerializer (documento_activo solo en riesgos). */
export interface CitationDto {
  numero: number
  fragmento_id: number
  documento_codigo: string
  documento_titulo: string
  version: string
  documento_activo?: boolean
  pagina_inicio: number | null
  pagina_fin: number | null
  contenido: string
}

/** OperationalGuidanceOutputSerializer */
export interface OperationalGuidanceDto {
  incidencia_id: number
  estado_incidencia: EstadoIncidenciaDto
  tarea_ia: { id: number; estado: EstadoTareaDto; error_codigo: string | null; error_detalle: string | null } | null
  orientacion: {
    tipo: TipoOrientacionDto | null
    resumen: string | null
    advertencia: string | null
    creada_en: string
    pasos: { orden: number; instruccion: string }[]
    citas: CitationDto[]
    respuesta: { resultado: ResultadoOrientacionDto; respondida_en: string } | null
  } | null
}

export interface OrientationFeedbackRequestDto {
  resultado: ResultadoOrientacionDto
}

/** HumanAttentionInputSerializer */
export interface HumanAttentionRequestDto {
  acciones?: string
  nota_resolucion?: string
  cerrar: boolean
}

/** RetryStrategicAnalysisOutputSerializer */
export interface RetryStrategicDto {
  incidencia_id: number
  tarea_ia: { id: number; rama: RamaTareaDto; intento: number; estado: EstadoTareaDto; clave_idempotencia: string; creada_en: string }
}

// ---------------------------------------------------------------------------
// Gobierno de riesgos (/risk-versions/, /risks/dashboard/)
// ---------------------------------------------------------------------------
/** VersionIncidenciaOutputSerializer */
export interface RiskLinkedIncidentDto {
  analisis_id: number
  incidencia_id: number
  referencia: string
  titulo: string
  registrada_en: string
  estado_incidencia: EstadoIncidenciaDto | null
  activo_nombre: string | null
  estado: EstadoVinculoDto
  similitud: number | null
  motivo_similitud: string | null
  extracto_reporte: string | null
  revisada_por_nombre: string | null
  revisada_en: string | null
  motivo_retiro: string | null
}

/** EvaluacionRiesgoOutputSerializer */
export interface RiskEvaluationDto {
  version_id: number
  celda_id: number
  probabilidad: number
  impacto: number
  nivel_codigo: NivelRiesgoCodigoDto
  nivel_orden: number
  matriz_id: number
  matriz_nombre: string
  matriz_version: string
  justificacion: string | null
  evaluador_id: number
  evaluador_nombre: string
  evaluada_en: string
}

/** DecisionRiesgoOutputSerializer */
export interface RiskDecisionDto {
  version_id: number
  accion: AccionDecisionRiesgoDto
  analista_id: number
  analista_nombre: string
  observacion: string | null
  justificacion_sin_fuentes: string | null
  decidida_en: string
}

/** RiskVersionListDetailOutputSerializer */
export interface RiskVersionDto {
  id: number
  riesgo_id: number
  riesgo_codigo: string
  numero: number
  origen: string | null
  estado: EstadoVersionRiesgoDto
  posible_recurrencia: boolean
  version_anterior_id: number | null
  titulo: string
  descripcion: string | null
  amenaza: string | null
  vulnerabilidad: string | null
  consecuencia: string | null
  recomendacion: string | null
  origen_recomendacion: string | null
  creada_por_id: number
  creada_por_nombre: string
  creada_en: string
  activo_identificado: string | null
  activo_confirmado_id: number | null
  activo_confirmado_nombre: string | null
  activo_confirmado_criticidad: number | null
  agrupacion_confirmada: boolean
  agrupacion_confirmada_por_nombre: string | null
  agrupacion_confirmada_en: string | null
  tiene_citas_estrategicas: boolean
  citas: CitationDto[]
  incidencias: RiskLinkedIncidentDto[]
  total_incidencias_incluidas: number
  evaluacion: RiskEvaluationDto | null
  decision: RiskDecisionDto | null
}

/** Filtros de RiskVersionFilter (querystring). */
export interface RiskVersionListParamsDto {
  estado?: string
  riesgo_id?: number
  origen?: string
  bandeja?: 'nuevas' | 'pendientes_revision' | 'rechazadas' | 'decididas'
  q?: string
}

export interface RemoveIncidentRequestDto {
  motivo_retiro: string
}

export interface ConfirmGroupingRequestDto {
  activo_confirmado_id: number
  justificacion_cambio_activo?: string
}

/** RiskEvaluateInputSerializer */
export interface RiskEvaluateRequestDto {
  probabilidad: number
  impacto: number
  justificacion: string
}

/** RiskDecisionInputSerializer — campos corregidos solo con accion === 'CORREGIDA'. */
export interface RiskDecisionRequestDto {
  accion: AccionDecisionRiesgoDto
  observacion?: string
  justificacion_sin_fuentes?: string
  titulo?: string
  descripcion?: string
  amenaza?: string
  vulnerabilidad?: string
  consecuencia?: string
  recomendacion?: string
}

/** RiskDashboardOutputSerializer */
export interface RiskDashboardDto {
  generado_en: string
  total_riesgos: number
  total_riesgos_vigentes: number
  riesgos_vigentes_por_nivel: { nivel_codigo: NivelRiesgoCodigoDto; orden: number; total: number }[]
  propuestas_pendientes: number
  propuestas_nuevas_agrupaciones: number
  propuestas_pendientes_revision: number
  propuestas_posible_recurrencia: number
  versiones_rechazadas: number
  incidencias_por_estado: Record<string, number>
  incidencias_por_activo: { activo_id: number | null; activo_nombre: string; total: number }[]
  serie_incidencias: { fecha: string; total: number }[]
  registro_riesgos: {
    riesgo_id: number
    riesgo_codigo: string
    version_vigente_id: number
    version_vigente_numero: number
    titulo: string
    activo_confirmado_id: number | null
    activo_confirmado_nombre: string | null
    nivel_codigo: NivelRiesgoCodigoDto | null
    probabilidad: number | null
    impacto: number | null
    validada_en: string
    total_incidencias: number
    propuesta_pendiente_id: number | null
    propuesta_pendiente_numero: number | null
  }[]
}

// ---------------------------------------------------------------------------
// Envolturas genéricas de DRF
// ---------------------------------------------------------------------------
/** EventoAuditoriaOutputSerializer (GET /admin/audit-events/, permiso usuario.administrar). */
export interface AuditEventDto {
  id: number
  accion: string
  detalle: string | null
  ocurrido_en: string
  actor_id: number | null
  actor_nombre: string | null
  actor_correo: string | null
  incidencia_id: number | null
  version_riesgo_id: number | null
  version_documento_id: number | null
  matriz_id: number | null
  activo_id: number | null
  usuario_objeto_id: number | null
  rol_id: number | null
}

/** Filtros de AuditEventFilter + búsqueda y paginación (page_size 50). */
export interface AuditEventListParamsDto {
  page?: number
  accion?: string
  search?: string
}

export interface PaginatedResponseDto<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/** Cuerpo de error de DRF: `detail` global o errores por campo. */
export type DrfErrorDto = { detail?: string } & Record<string, string[] | string | undefined>
