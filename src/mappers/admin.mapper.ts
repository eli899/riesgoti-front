import type { AIConfigFormValues } from '@/schemas/aiConfig.schema'
import type { AssetFormValues } from '@/schemas/asset.schema'
import type { DocumentUploadFormValues } from '@/schemas/document.schema'
import type { RoleFormValues } from '@/schemas/role.schema'
import type { UserFormValues } from '@/schemas/user.schema'
import type {
  AIConfigDto,
  AIConfigUpdateRequestDto,
  AIConnectionTestDto,
  AIConnectionTestRequestDto,
  AssetDto,
  AssetRequestDto,
  AssetTypeDto,
  AuditEventDto,
  AuditEventListParamsDto,
  DocumentFragmentDto,
  DocumentPreviewDto,
  DocumentVersionDto,
  MatrixConfigDto,
  MatrixCriterionDto,
  MatrixPublishRequestDto,
  PaginatedResponseDto,
  PermissionDto,
  RoleDto,
  RoleRequestDto,
  UserDto,
  UserRequestDto,
} from '@/types/api.types'
import type {
  AdminUser,
  AIConfig,
  AIConnectionTestResult,
  Asset,
  AssetCriticality,
  AssetType,
  AuditEvent,
  AuditEventFilters,
  AuditEventPage,
  AuditTargetKind,
  DocumentFragment,
  DocumentPreview,
  DocumentVersion,
  MatrixConfig,
  MatrixCriterion,
  MatrixPublishInput,
  Permission,
  Role,
} from '@/types/domain.types'
import { AUDIT_TARGET_KIND } from '@/constants/domain.constants'
import { SYSTEM_ROLE_CODES } from '@/constants/rbac.constants'
import { fromApiCriticalityToDomain, optionalText, toUserRef } from './common.mapper'

// ---------------------------------------------------------------------------
// Configuración IA/RAG
// ---------------------------------------------------------------------------
export function fromApiAIConfigToDomain(dto: AIConfigDto): AIConfig {
  return {
    id: dto.id,
    version: dto.version_configuracion,
    llmProvider: dto.proveedor_llm,
    llmModel: dto.modelo_llm,
    llmBaseUrl: dto.endpoint_base_llm,
    llmApiKeyMask: dto.api_key_llm_mascara,
    embeddingProvider: dto.proveedor_embedding,
    embeddingModel: dto.modelo_embedding,
    embeddingApiKeyMask: dto.api_key_embedding_mascara,
    chunkSize: dto.chunk_size,
    chunkOverlap: dto.chunk_overlap,
    topK: dto.top_k,
    similarityThreshold: Number(dto.umbral_similitud),
    active: dto.activa,
    createdAt: dto.creado_en,
    requiresReindex: dto.requiere_reindexacion_documentos,
    outdatedVersions: dto.versiones_desfasadas.map((v) => ({
      id: v.id, code: v.codigo, version: v.version, embeddingModel: v.modelo_embedding,
    })),
  }
}

/** Valores iniciales del formulario a partir de la configuración vigente (las API keys nunca se precargan). */
export function fromDomainAIConfigToFormValues(config: AIConfig): AIConfigFormValues {
  return {
    proveedor_llm: config.llmProvider,
    modelo_llm: config.llmModel,
    endpoint_base_llm: config.llmBaseUrl ?? '',
    api_key_llm: '',
    proveedor_embedding: config.embeddingProvider,
    modelo_embedding: config.embeddingModel,
    api_key_embedding: '',
    chunk_size: config.chunkSize,
    chunk_overlap: config.chunkOverlap,
    top_k: config.topK,
    umbral_similitud: config.similarityThreshold,
  }
}

/** Las API keys vacías se omiten para conservar las claves cifradas vigentes. */
export function fromDomainAIConfigToApi(values: AIConfigFormValues): AIConfigUpdateRequestDto {
  return {
    proveedor_llm: values.proveedor_llm,
    modelo_llm: values.modelo_llm.trim(),
    endpoint_base_llm: optionalText(values.endpoint_base_llm) ?? null,
    api_key_llm: optionalText(values.api_key_llm),
    proveedor_embedding: values.proveedor_embedding,
    modelo_embedding: values.modelo_embedding.trim(),
    api_key_embedding: optionalText(values.api_key_embedding),
    chunk_size: values.chunk_size,
    chunk_overlap: values.chunk_overlap,
    top_k: values.top_k,
    umbral_similitud: Number(values.umbral_similitud.toFixed(3)),
  }
}

export function fromApiAIConnectionTestToDomain(dto: AIConnectionTestDto): AIConnectionTestResult {
  return {
    llm: {
      ok: dto.llm_status === 'ok',
      provider: dto.llm_provider,
      model: dto.llm_model,
      latencyMs: dto.llm_latency_ms,
      error: dto.llm_error,
    },
    embedding: {
      ok: dto.embedding_status === 'ok',
      provider: dto.embedding_provider,
      model: dto.embedding_model,
      latencyMs: dto.embedding_latency_ms,
      error: dto.embedding_error,
      dimensions: dto.embedding_dimensions,
    },
  }
}

// ---------------------------------------------------------------------------
// Base de conocimiento
// ---------------------------------------------------------------------------
export function fromApiDocumentVersionToDomain(dto: DocumentVersionDto): DocumentVersion {
  return {
    id: dto.id,
    documentId: dto.documento_id,
    code: dto.codigo,
    title: dto.titulo,
    description: dto.descripcion,
    version: dto.version,
    sha256: dto.sha256,
    processing: dto.procesamiento,
    purpose: dto.finalidad,
    active: dto.activa,
    embeddingModel: dto.modelo_embedding,
    segmentationVersion: dto.version_segmentacion,
    processingError: dto.error_procesamiento,
    fragmentCount: dto.total_fragmentos,
    requiresReindex: dto.requiere_reindexacion,
    uploadedBy: toUserRef(dto.cargada_por_id, dto.cargada_por_nombre),
    uploadedAt: dto.cargada_en,
    authorizedBy: dto.autorizada_por_id === null ? null : toUserRef(dto.autorizada_por_id, dto.autorizada_por_nombre),
    authorizedAt: dto.autorizada_en,
    updatedAt: dto.ultima_modificacion,
  }
}

function fromApiFragmentToDomain(dto: DocumentFragmentDto): DocumentFragment {
  return { id: dto.id, order: dto.orden, pageStart: dto.pagina_inicio, pageEnd: dto.pagina_fin, content: dto.contenido }
}

export function fromApiDocumentPreviewToDomain(dto: DocumentPreviewDto): DocumentPreview {
  return {
    id: dto.id,
    code: dto.codigo,
    title: dto.titulo,
    version: dto.version,
    processing: dto.procesamiento,
    active: dto.activa,
    embeddingModel: dto.modelo_embedding,
    segmentationVersion: dto.version_segmentacion,
    processingError: dto.error_procesamiento,
    fragmentCount: dto.total_fragmentos,
    fragments: dto.fragmentos.map(fromApiFragmentToDomain),
  }
}

/** Formulario de carga -> multipart/form-data esperado por DocumentUploadInputSerializer. */
export function fromDomainDocumentUploadToApi(values: DocumentUploadFormValues): FormData {
  const body = new FormData()
  body.append('codigo', values.codigo.trim().toUpperCase())
  body.append('titulo', values.titulo.trim())
  const descripcion = optionalText(values.descripcion)
  if (descripcion) body.append('descripcion', descripcion)
  body.append('version', values.version.trim())
  body.append('finalidad', values.finalidad)
  body.append('archivo', values.archivo)
  return body
}

// ---------------------------------------------------------------------------
// Activos y matriz 5x5
// ---------------------------------------------------------------------------
export function fromApiAssetToDomain(dto: AssetDto): Asset {
  return {
    id: dto.id,
    typeId: dto.tipo_id,
    typeName: dto.tipo_nombre,
    code: dto.codigo,
    name: dto.nombre,
    description: dto.descripcion,
    criticality: fromApiCriticalityToDomain(dto.criticidad),
    active: dto.activo,
  }
}

function fromApiCriterionToDomain(dto: MatrixCriterionDto): MatrixCriterion {
  return { value: dto.valor, name: dto.nombre, description: dto.descripcion }
}

export function fromApiMatrixToDomain(dto: MatrixConfigDto): MatrixConfig {
  return {
    id: dto.id,
    name: dto.nombre,
    version: dto.version,
    status: dto.estado,
    active: dto.activa,
    createdBy: toUserRef(dto.creada_por_id, dto.creada_por_nombre),
    createdAt: dto.creada_en,
    levels: dto.niveles.map((n) => ({ id: n.id, code: n.codigo, order: n.orden })),
    probabilityCriteria: dto.criterios_probabilidad.map(fromApiCriterionToDomain),
    impactCriteria: dto.criterios_impacto.map(fromApiCriterionToDomain),
    cells: dto.celdas.map((c) => ({
      id: c.id,
      probability: c.probabilidad,
      impact: c.impacto,
      levelId: c.nivel_id,
      levelCode: c.nivel_codigo,
      levelOrder: c.nivel_orden,
    })),
  }
}

export function fromDomainMatrixToApi(model: MatrixPublishInput): MatrixPublishRequestDto {
  const toCriteria = (items: MatrixPublishInput['probabilityCriteria']) =>
    items?.map((c) => ({ valor: c.value, nombre: c.name.trim(), descripcion: optionalText(c.description) ?? null }))
  return {
    nombre: optionalText(model.name),
    criterios_probabilidad: toCriteria(model.probabilityCriteria),
    criterios_impacto: toCriteria(model.impactCriteria),
    celdas: model.cells.map((c) => ({ probabilidad: c.probability, impacto: c.impact, nivel_codigo: c.levelCode })),
  }
}

// ---------------------------------------------------------------------------
// Catálogo de activos: escritura
// ---------------------------------------------------------------------------
const CRITICALITY_VALUE: Record<AssetCriticality, number> = { BAJO: 1, MEDIO: 2, ALTO: 3, CRITICO: 4 }

export function fromApiAssetTypeToDomain(dto: AssetTypeDto): AssetType {
  return { id: dto.id, name: dto.nombre, active: dto.activo }
}

export function fromDomainAssetToFormValues(asset: Asset | null, defaultTypeId?: number): AssetFormValues {
  return {
    tipo_id: asset?.typeId ?? defaultTypeId ?? 0,
    codigo: asset?.code ?? '',
    nombre: asset?.name ?? '',
    descripcion: asset?.description ?? '',
    criticidad: asset?.criticality ? CRITICALITY_VALUE[asset.criticality] : null,
    activo: asset?.active ?? true,
  }
}

export function fromDomainAssetToApi(values: AssetFormValues): AssetRequestDto {
  return {
    tipo_id: values.tipo_id,
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
    descripcion: optionalText(values.descripcion) ?? null,
    criticidad: values.criticidad,
    activo: values.activo,
  }
}

// ---------------------------------------------------------------------------
// Usuarios, roles y permisos
// ---------------------------------------------------------------------------
export function fromApiUserToDomain(dto: UserDto): AdminUser {
  return {
    id: dto.id,
    firstName: dto.nombres,
    lastName: dto.apellidos,
    fullName: dto.nombre_completo,
    email: dto.correo,
    roleId: dto.rol_id,
    roleCode: dto.rol_codigo,
    roleName: dto.rol_nombre,
    active: dto.activo,
    createdAt: dto.creado_en,
  }
}

export function fromDomainUserToFormValues(user: AdminUser | null, defaultRoleId?: number): UserFormValues {
  return {
    nombres: user?.firstName ?? '',
    apellidos: user?.lastName ?? '',
    correo: user?.email ?? '',
    rol_id: user?.roleId ?? defaultRoleId ?? 0,
    activo: user?.active ?? true,
    password: '',
  }
}

/** La contraseña vacía se omite (en edición conserva la actual). */
export function fromDomainUserToApi(values: UserFormValues): UserRequestDto {
  return {
    nombres: values.nombres.trim(),
    apellidos: values.apellidos.trim(),
    correo: values.correo.trim().toLowerCase(),
    rol_id: values.rol_id,
    activo: values.activo,
    password: values.password ? values.password : undefined,
  }
}

export function fromApiRoleToDomain(dto: RoleDto): Role {
  return {
    id: dto.id,
    code: dto.codigo,
    name: dto.nombre,
    active: dto.activo,
    system: SYSTEM_ROLE_CODES.includes(dto.codigo),
    permissions: dto.permisos,
    userCount: dto.total_usuarios,
  }
}

export function fromApiPermissionToDomain(dto: PermissionDto): Permission {
  return { id: dto.id, code: dto.codigo, description: dto.descripcion, active: dto.activo }
}

export function fromDomainRoleToApi(values: RoleFormValues): RoleRequestDto {
  return {
    codigo: values.codigo.trim(),
    nombre: values.nombre.trim(),
    activo: values.activo,
    permisos: [...new Set(values.permisos)].sort(),
  }
}

/** Prueba de conectividad con los valores del formulario (aún no guardados); lo omitido se toma de la configuración activa. */
export function fromDomainAIConfigToConnectionTestApi(values: AIConfigFormValues): AIConnectionTestRequestDto {
  const full = fromDomainAIConfigToApi(values)
  return {
    proveedor_llm: full.proveedor_llm,
    modelo_llm: full.modelo_llm,
    endpoint_base_llm: full.endpoint_base_llm,
    api_key_llm: full.api_key_llm,
    proveedor_embedding: full.proveedor_embedding,
    modelo_embedding: full.modelo_embedding,
    api_key_embedding: full.api_key_embedding,
  }
}

// ---------------------------------------------------------------------------
// Auditoría
// ---------------------------------------------------------------------------
const AUDIT_PAGE_SIZE = 50

const AUDIT_TARGETS: [keyof AuditEventDto, AuditTargetKind][] = [
  ['incidencia_id', AUDIT_TARGET_KIND.INCIDENCIA],
  ['version_riesgo_id', AUDIT_TARGET_KIND.VERSION_RIESGO],
  ['version_documento_id', AUDIT_TARGET_KIND.VERSION_DOCUMENTO],
  ['matriz_id', AUDIT_TARGET_KIND.MATRIZ],
  ['activo_id', AUDIT_TARGET_KIND.ACTIVO],
  ['usuario_objeto_id', AUDIT_TARGET_KIND.USUARIO],
  ['rol_id', AUDIT_TARGET_KIND.ROL],
]

export function fromApiAuditEventToDomain(dto: AuditEventDto): AuditEvent {
  return {
    id: dto.id,
    action: dto.accion,
    detail: dto.detalle,
    occurredAt: dto.ocurrido_en,
    actor: dto.actor_id === null ? null : { id: dto.actor_id, name: dto.actor_nombre ?? 'Usuario eliminado', email: dto.actor_correo },
    targets: AUDIT_TARGETS.filter(([key]) => dto[key] !== null).map(([key, kind]) => ({ kind, id: dto[key] as number })),
  }
}

export function fromApiAuditEventPageToDomain(dto: PaginatedResponseDto<AuditEventDto>): AuditEventPage {
  return { total: dto.count, pages: Math.max(1, Math.ceil(dto.count / AUDIT_PAGE_SIZE)), events: dto.results.map(fromApiAuditEventToDomain) }
}

export function fromDomainAuditFiltersToApi(filters: AuditEventFilters): AuditEventListParamsDto {
  return { page: filters.page, accion: optionalText(filters.action), search: optionalText(filters.search) }
}
