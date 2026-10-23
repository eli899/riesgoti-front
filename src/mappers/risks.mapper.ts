import type {
  ConfirmGroupingValues,
  CorrectableField,
  RemoveIncidentFromGroupValues,
  RiskDecisionFormValues,
  RiskEvaluateValues,
} from '@/schemas/riskEvaluation.schema'
import type {
  ConfirmGroupingRequestDto,
  RemoveIncidentRequestDto,
  RiskDashboardDto,
  RiskDecisionDto,
  RiskDecisionRequestDto,
  RiskEvaluateRequestDto,
  RiskEvaluationDto,
  RiskLinkedIncidentDto,
  RiskVersionDto,
  RiskVersionListParamsDto,
} from '@/types/api.types'
import type {
  IncidentStatus,
  RiskDashboard,
  RiskDecision,
  RiskEvaluation,
  RiskLinkedIncident,
  RiskRegistryRow,
  RiskVersion,
  RiskVersionFilters,
} from '@/types/domain.types'
import { fromApiCitationToDomain, fromApiCriticalityToDomain, optionalText, toUserRef } from './common.mapper'

/** Centinela del análisis estratégico (llm_schemas.NO_DETERMINADO) para vectores no sustentados: el dominio usa null. */
const NOT_DETERMINED_SENTINEL = 'NO_DETERMINADO'
const determined = (value: string | null) => (value === null || value.trim() === NOT_DETERMINED_SENTINEL ? null : value)

function fromApiLinkedIncidentToDomain(dto: RiskLinkedIncidentDto): RiskLinkedIncident {
  return {
    analysisId: dto.analisis_id,
    incidentId: dto.incidencia_id,
    reference: dto.referencia,
    title: dto.titulo,
    registeredAt: dto.registrada_en,
    incidentStatus: dto.estado_incidencia,
    assetName: dto.activo_nombre,
    linkStatus: dto.estado,
    similarity: dto.similitud === null ? null : Number(dto.similitud),
    similarityReason: dto.motivo_similitud,
    reportExcerpt: dto.extracto_reporte,
    reviewedByName: dto.revisada_por_nombre,
    reviewedAt: dto.revisada_en,
    removalReason: dto.motivo_retiro,
  }
}

export function fromApiRiskEvaluationToDomain(dto: RiskEvaluationDto): RiskEvaluation {
  return {
    versionId: dto.version_id,
    cellId: dto.celda_id,
    probability: dto.probabilidad,
    impact: dto.impacto,
    levelCode: dto.nivel_codigo,
    levelOrder: dto.nivel_orden,
    matrix: { id: dto.matriz_id, name: dto.matriz_nombre, version: dto.matriz_version },
    justification: dto.justificacion,
    evaluator: toUserRef(dto.evaluador_id, dto.evaluador_nombre),
    evaluatedAt: dto.evaluada_en,
  }
}

function fromApiRiskDecisionToDomain(dto: RiskDecisionDto): RiskDecision {
  return {
    versionId: dto.version_id,
    action: dto.accion,
    analyst: toUserRef(dto.analista_id, dto.analista_nombre),
    observation: dto.observacion,
    justificationWithoutSources: dto.justificacion_sin_fuentes,
    decidedAt: dto.decidida_en,
  }
}

export function fromApiRiskVersionToDomain(dto: RiskVersionDto): RiskVersion {
  return {
    id: dto.id,
    riskId: dto.riesgo_id,
    riskCode: dto.riesgo_codigo,
    number: dto.numero,
    origin: dto.origen,
    status: dto.estado,
    possibleRecurrence: dto.posible_recurrencia,
    previousVersionId: dto.version_anterior_id,
    title: dto.titulo,
    description: dto.descripcion,
    threat: determined(dto.amenaza),
    vulnerability: determined(dto.vulnerabilidad),
    consequence: determined(dto.consecuencia),
    recommendation: dto.recomendacion,
    recommendationOrigin: dto.origen_recomendacion,
    createdBy: toUserRef(dto.creada_por_id, dto.creada_por_nombre),
    createdAt: dto.creada_en,
    identifiedAsset: determined(dto.activo_identificado),
    confirmedAsset: dto.activo_confirmado_id === null
      ? null
      : {
          id: dto.activo_confirmado_id,
          name: dto.activo_confirmado_nombre,
          criticality: fromApiCriticalityToDomain(dto.activo_confirmado_criticidad),
        },
    grouping: {
      confirmed: dto.agrupacion_confirmada,
      confirmedByName: dto.agrupacion_confirmada_por_nombre,
      confirmedAt: dto.agrupacion_confirmada_en,
    },
    hasStrategicCitations: dto.tiene_citas_estrategicas,
    citations: dto.citas.map(fromApiCitationToDomain),
    incidents: dto.incidencias.map(fromApiLinkedIncidentToDomain),
    includedIncidentCount: dto.total_incidencias_incluidas,
    evaluation: dto.evaluacion ? fromApiRiskEvaluationToDomain(dto.evaluacion) : null,
    decision: dto.decision ? fromApiRiskDecisionToDomain(dto.decision) : null,
  }
}

export function fromDomainRiskFiltersToApi(filters: RiskVersionFilters = {}): RiskVersionListParamsDto {
  return {
    estado: filters.statuses?.length ? filters.statuses.join(',') : undefined,
    riesgo_id: filters.riskId,
    origen: filters.origin,
    bandeja: filters.inbox,
    q: optionalText(filters.search),
  }
}

/** Precarga del formulario de decisión desde la VERSION_RIESGO vigente. */
export function fromDomainRiskVersionToDecisionDefaults(version: RiskVersion): RiskDecisionFormValues {
  return {
    accion: 'VALIDADA',
    activo_confirmado_id: version.confirmedAsset?.id ?? null,
    agrupacion_confirmada: version.grouping.confirmed,
    probabilidad: version.evaluation?.probability ?? null,
    impacto: version.evaluation?.impact ?? null,
    justificacion: version.evaluation?.justification ?? '',
    tiene_citas_estrategicas: version.hasStrategicCitations,
    justificacion_sin_fuentes: '',
    observacion: '',
  }
}

/** Contenido vigente de la versión con el que se precargan los campos de una corrección. */
export function fromDomainRiskVersionToCorrectionDefaults(version: RiskVersion): Record<CorrectableField, string> {
  return {
    titulo_corregido: version.title,
    descripcion_corregida: version.description ?? '',
    amenaza_corregida: version.threat ?? '',
    vulnerabilidad_corregida: version.vulnerability ?? '',
    consecuencia_corregida: version.consequence ?? '',
    recomendacion_corregida: version.recommendation ?? '',
  }
}

/**
 * Solo viajan al backend los campos de RiskDecisionInputSerializer; activo, agrupación y evaluación ya están
 * persistidos por confirm-grouping y evaluate, y el backend revalida las precondiciones. En una corrección solo se
 * envían los campos que difieren de `original` (el backend conserva el valor previo de los omitidos).
 */
export function fromDomainRiskDecisionToApi(values: RiskDecisionFormValues, original?: Record<CorrectableField, string>): RiskDecisionRequestDto {
  const body: RiskDecisionRequestDto = {
    accion: values.accion,
    observacion: optionalText(values.observacion),
  }
  if (values.accion === 'VALIDADA' && !values.tiene_citas_estrategicas) {
    body.justificacion_sin_fuentes = optionalText(values.justificacion_sin_fuentes)
  }
  if (values.accion === 'CORREGIDA') {
    const changed = (field: CorrectableField) =>
      original && (values[field] ?? '').trim() === original[field].trim() ? undefined : optionalText(values[field])
    body.titulo = changed('titulo_corregido')
    body.descripcion = changed('descripcion_corregida')
    body.amenaza = changed('amenaza_corregida')
    body.vulnerabilidad = changed('vulnerabilidad_corregida')
    body.consecuencia = changed('consecuencia_corregida')
    body.recomendacion = changed('recomendacion_corregida')
  }
  return body
}

export function fromDomainRemoveIncidentToApi(values: RemoveIncidentFromGroupValues): RemoveIncidentRequestDto {
  return { motivo_retiro: values.motivo_retiro.trim() }
}

export function fromDomainConfirmGroupingToApi(values: ConfirmGroupingValues): ConfirmGroupingRequestDto {
  return {
    activo_confirmado_id: values.activo_confirmado_id,
    justificacion_cambio_activo: optionalText(values.justificacion_cambio_activo),
  }
}

export function fromDomainRiskEvaluateToApi(values: RiskEvaluateValues): RiskEvaluateRequestDto {
  return { probabilidad: values.probabilidad, impacto: values.impacto, justificacion: values.justificacion.trim() }
}

export function fromApiRiskDashboardToDomain(dto: RiskDashboardDto): RiskDashboard {
  return {
    generatedAt: dto.generado_en,
    totalRisks: dto.total_riesgos,
    currentRisks: dto.total_riesgos_vigentes,
    currentRisksByLevel: dto.riesgos_vigentes_por_nivel.map((n) => ({ levelCode: n.nivel_codigo, order: n.orden, total: n.total })),
    pendingProposals: dto.propuestas_pendientes,
    newGroupingProposals: dto.propuestas_nuevas_agrupaciones,
    pendingReviewProposals: dto.propuestas_pendientes_revision,
    possibleRecurrenceProposals: dto.propuestas_posible_recurrencia,
    rejectedVersions: dto.versiones_rechazadas,
    incidentsByStatus: dto.incidencias_por_estado as Partial<Record<IncidentStatus, number>>,
    incidentsByAsset: dto.incidencias_por_activo.map((a) => ({ assetId: a.activo_id, assetName: a.activo_nombre, total: a.total })),
    incidentSeries: dto.serie_incidencias.map((s) => ({ date: s.fecha, total: s.total })),
    riskRegister: dto.registro_riesgos.map((r) => ({
      riskId: r.riesgo_id,
      riskCode: r.riesgo_codigo,
      currentVersionId: r.version_vigente_id,
      currentVersionNumber: r.version_vigente_numero,
      title: r.titulo,
      confirmedAssetId: r.activo_confirmado_id,
      confirmedAssetName: r.activo_confirmado_nombre,
      levelCode: r.nivel_codigo,
      probability: r.probabilidad,
      impact: r.impacto,
      validatedAt: r.validada_en,
      incidentCount: r.total_incidencias,
      pendingProposal: r.propuesta_pendiente_id === null || r.propuesta_pendiente_numero === null
        ? null
        : { id: r.propuesta_pendiente_id, number: r.propuesta_pendiente_numero },
    })),
  }
}

/**
 * Registro de riesgos: una fila por RIESGO. Usa la versión VALIDADA vigente del tablero cuando existe y, si no, la
 * última versión del riesgo (pendiente o rechazada).
 */
export function toRiskRegistryRows(dashboard: RiskDashboard, versions: RiskVersion[]): RiskRegistryRow[] {
  const latestByRisk = new Map<number, RiskVersion>()
  for (const v of versions) {
    const current = latestByRisk.get(v.riskId)
    if (!current || v.number > current.number) latestByRisk.set(v.riskId, v)
  }
  const validated = new Map(dashboard.riskRegister.map((r) => [r.riskId, r]))
  const rows: RiskRegistryRow[] = []
  for (const latest of latestByRisk.values()) {
    const entry = validated.get(latest.riskId)
    const pending = latest.status === 'PENDIENTE' ? { versionId: latest.id, number: latest.number } : null
    rows.push(entry
      ? {
          riskId: entry.riskId, riskCode: entry.riskCode, category: 'VALIDADO', status: 'VALIDADA',
          title: entry.title, assetName: entry.confirmedAssetName, levelCode: entry.levelCode,
          versionNumber: entry.currentVersionNumber, incidentCount: entry.incidentCount, updatedAt: entry.validatedAt,
          pendingProposal: entry.pendingProposal ? { versionId: entry.pendingProposal.id, number: entry.pendingProposal.number } : null,
        }
      : {
          riskId: latest.riskId, riskCode: latest.riskCode, category: latest.status === 'RECHAZADA' ? 'RECHAZADO' : 'PENDIENTE',
          status: latest.status, title: latest.title, assetName: latest.confirmedAsset?.name ?? latest.identifiedAsset,
          levelCode: latest.evaluation?.levelCode ?? null, versionNumber: latest.number, incidentCount: latest.includedIncidentCount,
          updatedAt: latest.decision?.decidedAt ?? latest.createdAt, pendingProposal: pending,
        })
  }
  return rows.sort((a, b) => a.riskCode.localeCompare(b.riskCode))
}
