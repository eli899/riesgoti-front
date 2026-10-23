/**
 * Modelos de dominio limpios (camelCase) consumidos por Custom Hooks, Páginas y Componentes.
 * Alineados con bd.sql y con el catálogo RBAC (ROL / PERMISO / ROL_PERMISO).
 */

export type RoleCode = 'REPORTANTE' | 'ANALISTA' | 'ADMIN'

export type PermissionCode =
  | 'incidencia.crear'
  | 'incidencia.ver_propias'
  | 'incidencia.ver_todas'
  | 'incidencia.cerrar_propias_por_feedback'
  | 'atencion.ver_cola'
  | 'atencion.atender'
  | 'riesgo.revisar_agrupacion'
  | 'riesgo.evaluar'
  | 'riesgo.validar'
  | 'riesgo.consultar'
  | 'activo.administrar'
  | 'documento.administrar'
  | 'matriz.administrar'
  | 'usuario.administrar'
  | 'rol.administrar'

export type IncidentStatus =
  | 'REGISTRADA'
  | 'EN_ANALISIS'
  | 'PENDIENTE_ATENCION_HUMANA'
  | 'EN_ATENCION'
  | 'CERRADA'

export type DocumentProcessingStatus =
  | 'PROCESANDO'
  | 'ERROR'
  | 'PENDIENTE_AUTORIZACION'
  | 'AUTORIZADO'

export type DocumentPurpose = 'OPERATIVA' | 'ESTRATEGICA' | 'AMBAS'

export type RiskDecisionAction = 'VALIDADA' | 'CORREGIDA' | 'RECHAZADA'

/** Estado derivado de una VERSION_RIESGO: 'PENDIENTE' cuando no existe fila en DECISION_RIESGO. */
export type RiskValidationStatus = 'PENDIENTE' | RiskDecisionAction

export type RiskLevelCode = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO'

/** ACTIVO.criticidad (INT 1..4) expresada en la misma escala que NIVEL_RIESGO. */
export type AssetCriticality = RiskLevelCode

export type AITaskBranch = 'OPERATIVA' | 'ESTRATEGICA'
export type AITaskStatus = 'PENDIENTE' | 'PROCESANDO' | 'COMPLETADA' | 'ERROR'
export type GuidanceType = 'SUGERENCIA' | 'SENSIBLE' | 'SIN_RESPALDO'
export type GuidanceResult = 'FUNCIONO' | 'NO_FUNCIONO'
export type IncidentLinkStatus = 'SUGERIDA' | 'CONFIRMADA' | 'RETIRADA'
export type LlmProvider = 'OPENAI' | 'GEMINI' | 'HUGGINGFACE_LOCAL'
export type EmbeddingProvider = 'OPENAI' | 'GEMINI' | 'SENTENCE_TRANSFORMERS'

/** Referencia compacta a un usuario (auditoría de quién creó, autorizó o decidió). */
export interface UserRef {
  id: number | null
  name: string
}

// ---------------------------------------------------------------------------
// Sesión
// ---------------------------------------------------------------------------
export interface SessionUser {
  id: number
  email: string
  firstName: string
  lastName: string
  fullName: string
  roleId: number
  roleCode: RoleCode
  roleName: string
  permissions: PermissionCode[]
}

export interface AuthSession {
  user: SessionUser
  accessToken: string
  refreshToken: string
}

// ---------------------------------------------------------------------------
// Citas normativas (CITA_ORIENTACION / CITA_VERSION_RIESGO -> FRAGMENTO_DOCUMENTO)
// ---------------------------------------------------------------------------
export interface Citation {
  number: number
  fragmentId: number
  documentCode: string
  documentTitle: string
  documentVersion: string
  /** null cuando el backend no informa el estado (citas operativas). */
  documentActive: boolean | null
  pageStart: number | null
  pageEnd: number | null
  content: string
}

// ---------------------------------------------------------------------------
// Administración IA/RAG
// ---------------------------------------------------------------------------
export interface AIConfig {
  id: number
  version: string
  llmProvider: LlmProvider
  llmModel: string
  llmBaseUrl: string | null
  llmApiKeyMask: string | null
  embeddingProvider: EmbeddingProvider
  embeddingModel: string
  embeddingApiKeyMask: string | null
  chunkSize: number
  chunkOverlap: number
  topK: number
  similarityThreshold: number
  active: boolean
  createdAt: string
  requiresReindex: boolean
  outdatedVersions: { id: number; code: string; version: string; embeddingModel: string | null }[]
}

export interface AIConnectionCheck {
  ok: boolean
  provider: string
  model: string
  latencyMs: number | null
  error: string | null
}

export interface AIConnectionTestResult {
  llm: AIConnectionCheck
  embedding: AIConnectionCheck & { dimensions: number | null }
}

export interface DocumentVersion {
  id: number
  documentId: number
  code: string
  title: string
  description: string | null
  version: string
  sha256: string
  processing: DocumentProcessingStatus
  purpose: DocumentPurpose
  active: boolean
  embeddingModel: string | null
  segmentationVersion: string | null
  processingError: string | null
  fragmentCount: number
  requiresReindex: boolean
  uploadedBy: UserRef
  uploadedAt: string
  authorizedBy: UserRef | null
  authorizedAt: string | null
  updatedAt: string
}

export interface DocumentFragment {
  id: number
  order: number
  pageStart: number | null
  pageEnd: number | null
  content: string
}

export interface DocumentPreview {
  id: number
  code: string
  title: string
  version: string
  processing: DocumentProcessingStatus
  active: boolean
  embeddingModel: string | null
  segmentationVersion: string | null
  processingError: string | null
  fragmentCount: number
  fragments: DocumentFragment[]
}

// ---------------------------------------------------------------------------
// Activos y matriz 5x5
// ---------------------------------------------------------------------------
export interface Asset {
  id: number
  typeId: number
  typeName: string
  code: string
  name: string
  description: string | null
  criticality: AssetCriticality | null
  active: boolean
}

export interface AssetType {
  id: number
  name: string
  active: boolean
}

// ---------------------------------------------------------------------------
// Usuarios, roles y permisos
// ---------------------------------------------------------------------------
export interface AdminUser {
  id: number
  firstName: string
  lastName: string
  fullName: string
  email: string
  roleId: number
  roleCode: string
  roleName: string
  active: boolean
  createdAt: string
}

export interface Role {
  id: number
  code: string
  name: string
  active: boolean
  /** Rol base del sistema (REPORTANTE, ANALISTA, ADMIN): su código no puede cambiar. */
  system: boolean
  permissions: string[]
  userCount: number
}

export interface Permission {
  id: number
  code: string
  description: string | null
  active: boolean
}

export interface MatrixCriterion {
  value: number
  name: string
  description: string | null
}

export interface MatrixCell {
  id: number
  probability: number
  impact: number
  levelId: number
  levelCode: RiskLevelCode
  levelOrder: number
}

export interface MatrixConfig {
  id: number
  name: string
  version: string
  status: string
  active: boolean
  createdBy: UserRef
  createdAt: string
  levels: { id: number; code: RiskLevelCode; order: number }[]
  probabilityCriteria: MatrixCriterion[]
  impactCriteria: MatrixCriterion[]
  cells: MatrixCell[]
}

export interface MatrixPublishInput {
  name?: string
  probabilityCriteria?: { value: number; name: string; description?: string | null }[]
  impactCriteria?: { value: number; name: string; description?: string | null }[]
  cells: { probability: number; impact: number; levelCode: RiskLevelCode }[]
}

// ---------------------------------------------------------------------------
// Incidencias y orientación operativa
// ---------------------------------------------------------------------------
export interface Incident {
  id: number
  reference: string
  title: string
  description: string
  assetId: number | null
  assetName: string | null
  assetFreeText: string | null
  reporter: UserRef
  status: IncidentStatus
  registeredAt: string
  evidenceCount: number
  guidanceType: GuidanceType | null
  guidanceResult: GuidanceResult | null
  operationalTaskStatus: AITaskStatus | null
  strategicTaskStatus: AITaskStatus | null
  analystName: string | null
}

export interface Evidence {
  id: number
  originalName: string
  mimeType: string
  bytes: number
  sha256: string
  createdAt: string
}

export interface StatusHistoryEntry {
  id: number
  status: IncidentStatus
  actor: UserRef
  reason: string | null
  occurredAt: string
}

export interface HumanAttention {
  incidentId: number
  analyst: UserRef
  startedAt: string
  actions: string | null
  resolutionNote: string | null
  closedAt: string | null
}

export interface AITaskSummary {
  id: number
  branch: AITaskBranch
  attempt: number
  status: AITaskStatus
  errorCode: string | null
  errorDetail: string | null
  createdAt: string
  finishedAt: string | null
}

export interface IncidentDetail extends Incident {
  evidences: Evidence[]
  history: StatusHistoryEntry[]
  attention: HumanAttention | null
  aiTasks: { operational: AITaskSummary | null; strategic: AITaskSummary | null }
  linkedRisks: { riskId: number; riskCode: string; versionId: number; versionNumber: number; linkStatus: IncidentLinkStatus }[]
}

export interface IncidentFilters {
  statuses?: IncidentStatus[]
  assetId?: number
  reporterId?: number
  maxAgeDays?: number
  search?: string
  attentionQueue?: boolean
  ordering?: string
}

export interface OperationalGuidance {
  incidentId: number
  incidentStatus: IncidentStatus
  task: { id: number; status: AITaskStatus; errorCode: string | null; errorDetail: string | null } | null
  guidance: {
    type: GuidanceType | null
    summary: string | null
    warning: string | null
    createdAt: string
    steps: { order: number; instruction: string }[]
    citations: Citation[]
    response: { result: GuidanceResult; respondedAt: string } | null
  } | null
  /** true mientras la tarea operativa no haya terminado (dispara el polling de 2500 ms). */
  isPending: boolean
}

// ---------------------------------------------------------------------------
// Gobierno de riesgos
// ---------------------------------------------------------------------------
export interface RiskLinkedIncident {
  analysisId: number
  incidentId: number
  reference: string
  title: string
  registeredAt: string
  incidentStatus: IncidentStatus | null
  assetName: string | null
  linkStatus: IncidentLinkStatus
  similarity: number | null
  similarityReason: string | null
  reportExcerpt: string | null
  reviewedByName: string | null
  reviewedAt: string | null
  removalReason: string | null
}

export interface RiskEvaluation {
  versionId: number
  cellId: number
  probability: number
  impact: number
  levelCode: RiskLevelCode
  levelOrder: number
  matrix: { id: number; name: string; version: string }
  justification: string | null
  evaluator: UserRef
  evaluatedAt: string
}

export interface RiskDecision {
  versionId: number
  action: RiskDecisionAction
  analyst: UserRef
  observation: string | null
  justificationWithoutSources: string | null
  decidedAt: string
}

export interface RiskVersion {
  id: number
  riskId: number
  riskCode: string
  number: number
  origin: string | null
  status: RiskValidationStatus
  possibleRecurrence: boolean
  previousVersionId: number | null
  title: string
  description: string | null
  threat: string | null
  vulnerability: string | null
  consequence: string | null
  recommendation: string | null
  recommendationOrigin: string | null
  createdBy: UserRef
  createdAt: string
  identifiedAsset: string | null
  confirmedAsset: { id: number; name: string | null; criticality: AssetCriticality | null } | null
  grouping: { confirmed: boolean; confirmedByName: string | null; confirmedAt: string | null }
  hasStrategicCitations: boolean
  citations: Citation[]
  incidents: RiskLinkedIncident[]
  includedIncidentCount: number
  evaluation: RiskEvaluation | null
  decision: RiskDecision | null
}

export type RiskInbox = 'nuevas' | 'pendientes_revision' | 'rechazadas' | 'decididas'

export interface RiskVersionFilters {
  statuses?: RiskValidationStatus[]
  riskId?: number
  origin?: string
  inbox?: RiskInbox
  search?: string
}

export interface RiskRegisterEntry {
  riskId: number
  riskCode: string
  currentVersionId: number
  currentVersionNumber: number
  title: string
  confirmedAssetId: number | null
  confirmedAssetName: string | null
  levelCode: RiskLevelCode | null
  probability: number | null
  impact: number | null
  validatedAt: string
  incidentCount: number
  pendingProposal: { id: number; number: number } | null
}

export type RiskRegistryCategory = 'VALIDADO' | 'PENDIENTE' | 'RECHAZADO'

/** Fila del registro de riesgos (una por RIESGO). */
export interface RiskRegistryRow {
  riskId: number
  riskCode: string
  category: RiskRegistryCategory
  status: RiskValidationStatus
  title: string
  assetName: string | null
  levelCode: RiskLevelCode | null
  versionNumber: number
  incidentCount: number
  updatedAt: string
  /** Versión pendiente de decisión (nueva propuesta sobre un riesgo vigente o propuesta inicial). */
  pendingProposal: { versionId: number; number: number } | null
}

export interface RiskDashboard {
  generatedAt: string
  totalRisks: number
  currentRisks: number
  currentRisksByLevel: { levelCode: RiskLevelCode; order: number; total: number }[]
  pendingProposals: number
  newGroupingProposals: number
  pendingReviewProposals: number
  possibleRecurrenceProposals: number
  rejectedVersions: number
  incidentsByStatus: Partial<Record<IncidentStatus, number>>
  incidentsByAsset: { assetId: number | null; assetName: string; total: number }[]
  incidentSeries: { date: string; total: number }[]
  riskRegister: RiskRegisterEntry[]
}

// ---------------------------------------------------------------------------
// Auditoría (EVENTO_AUDITORIA)
// ---------------------------------------------------------------------------
export interface AuditEvent {
  id: number
  action: string
  detail: string | null
  occurredAt: string
  actor: { id: number; name: string; email: string | null } | null
  /** Entidades afectadas presentes en el evento (incidencia, versión de riesgo, documento, matriz, activo, usuario, rol). */
  targets: { kind: AuditTargetKind; id: number }[]
}

export type AuditTargetKind = 'INCIDENCIA' | 'VERSION_RIESGO' | 'VERSION_DOCUMENTO' | 'MATRIZ' | 'ACTIVO' | 'USUARIO' | 'ROL'

export interface AuditEventPage {
  total: number
  pages: number
  events: AuditEvent[]
}

export interface AuditEventFilters {
  page: number
  action?: string
  search?: string
}
