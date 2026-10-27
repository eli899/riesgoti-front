import type { HumanAttentionFormValues, IncidentFormValues, OrientationFeedbackValues } from '@/schemas/incident.schema'
import type {
  AITaskSummaryDto,
  HumanAttentionDto,
  HumanAttentionRequestDto,
  IncidentDetailDto,
  IncidentDto,
  IncidentListParamsDto,
  OperationalGuidanceDto,
  OrientationFeedbackRequestDto,
} from '@/types/api.types'
import type {
  AITaskSummary,
  HumanAttention,
  Incident,
  IncidentDetail,
  IncidentFilters,
  OperationalGuidance,
} from '@/types/domain.types'
import { AI_TASK_STATUS, INCIDENT_INBOXES } from '@/constants/domain.constants'
import { fromApiCitationToDomain, optionalText, toUserRef } from './common.mapper'

export function fromApiIncidentToDomain(dto: IncidentDto): Incident {
  return {
    id: dto.id,
    reference: dto.referencia,
    title: dto.titulo,
    description: dto.descripcion,
    assetId: dto.activo_reportado_id,
    assetName: dto.activo_nombre,
    assetFreeText: dto.activo_texto,
    reporter: toUserRef(dto.reportante_id, dto.reportante_nombre),
    status: dto.estado_actual,
    registeredAt: dto.registrada_en,
    evidenceCount: dto.total_evidencias,
    guidanceType: dto.orientacion_tipo,
    guidanceResult: dto.orientacion_resultado,
    operationalTaskStatus: dto.tarea_operativa_estado,
    strategicTaskStatus: dto.tarea_estrategica_estado,
    analystName: dto.analista_nombre,
  }
}

function fromApiTaskToDomain(dto: AITaskSummaryDto | null): AITaskSummary | null {
  if (!dto) return null
  return {
    id: dto.id,
    branch: dto.rama,
    attempt: dto.intento,
    status: dto.estado,
    errorCode: dto.error_codigo,
    errorDetail: dto.error_detalle,
    createdAt: dto.creada_en,
    finishedAt: dto.terminada_en,
  }
}

function fromApiAttentionToDomain(dto: HumanAttentionDto | null): HumanAttention | null {
  if (!dto) return null
  return {
    incidentId: dto.incidencia_id,
    analyst: toUserRef(dto.analista_id, dto.analista_nombre),
    startedAt: dto.iniciada_en,
    actions: dto.acciones,
    resolutionNote: dto.nota_resolucion,
    closedAt: dto.cerrada_en,
  }
}

export function fromApiIncidentDetailToDomain(dto: IncidentDetailDto): IncidentDetail {
  return {
    ...fromApiIncidentToDomain(dto),
    evidences: dto.evidencias.map((e) => ({
      id: e.id, originalName: e.nombre_original, mimeType: e.tipo_mime, bytes: e.bytes, sha256: e.sha256, createdAt: e.creada_en,
    })),
    history: dto.historial.map((h) => ({
      id: h.id, status: h.estado, actor: toUserRef(h.actor_id, h.actor_nombre), reason: h.motivo, occurredAt: h.ocurrido_en,
    })),
    attention: fromApiAttentionToDomain(dto.atencion),
    aiTasks: {
      operational: fromApiTaskToDomain(dto.tareas_ia.operativa),
      strategic: fromApiTaskToDomain(dto.tareas_ia.estrategica),
    },
    linkedRisks: dto.riesgos_vinculados.map((r) => ({
      riskId: r.riesgo_id, riskCode: r.riesgo_codigo, versionId: r.version_id, versionNumber: r.version_numero, linkStatus: r.estado_vinculo,
    })),
  }
}

export function fromDomainIncidentFiltersToApi(filters: IncidentFilters = {}): IncidentListParamsDto {
  return {
    estado: filters.statuses?.length ? filters.statuses.join(',') : undefined,
    activo_reportado_id: filters.assetId,
    reportante_id: filters.reporterId,
    dias: filters.maxAgeDays,
    q: optionalText(filters.search),
    bandeja: filters.attentionQueue ? INCIDENT_INBOXES.ATTENTION : undefined,
    ordering: filters.ordering,
  }
}

/** Formulario de reporte -> multipart/form-data (IncidentCreateInputSerializer). */
export function fromDomainIncidentToApi(values: IncidentFormValues): FormData {
  const body = new FormData()
  body.append('titulo', values.titulo.trim())
  body.append('descripcion', values.descripcion.trim())
  if (values.activo_reportado_id) body.append('activo_reportado_id', String(values.activo_reportado_id))
  const activoTexto = optionalText(values.activo_texto)
  if (activoTexto) body.append('activo_texto', activoTexto)
  values.evidencias?.forEach((file) => body.append('evidencias', file))
  return body
}

/** La orientación sigue pendiente mientras no exista tarea o su estado no sea terminal. */
export function fromApiGuidanceToDomain(dto: OperationalGuidanceDto): OperationalGuidance {
  const taskStatus = dto.tarea_ia?.estado
  return {
    incidentId: dto.incidencia_id,
    incidentStatus: dto.estado_incidencia,
    task: dto.tarea_ia
      ? { id: dto.tarea_ia.id, status: dto.tarea_ia.estado, errorCode: dto.tarea_ia.error_codigo, errorDetail: dto.tarea_ia.error_detalle }
      : null,
    guidance: dto.orientacion
      ? {
          type: dto.orientacion.tipo,
          summary: dto.orientacion.resumen,
          warning: dto.orientacion.advertencia,
          createdAt: dto.orientacion.creada_en,
          steps: [...dto.orientacion.pasos]
            .sort((a, b) => a.orden - b.orden)
            .map((p) => ({ order: p.orden, instruction: p.instruccion })),
          citations: dto.orientacion.citas.map(fromApiCitationToDomain),
          response: dto.orientacion.respuesta
            ? { result: dto.orientacion.respuesta.resultado, respondedAt: dto.orientacion.respuesta.respondida_en }
            : null,
        }
      : null,
    isPending: taskStatus !== AI_TASK_STATUS.COMPLETADA && taskStatus !== AI_TASK_STATUS.ERROR,
  }
}

export function fromDomainOrientationFeedbackToApi(values: OrientationFeedbackValues): OrientationFeedbackRequestDto {
  return { resultado: values.resultado }
}

export function fromDomainAttentionToApi(values: HumanAttentionFormValues): HumanAttentionRequestDto {
  return {
    acciones: values.acciones?.trim() ?? undefined,
    nota_resolucion: values.nota_resolucion?.trim() ?? undefined,
    cerrar: values.cerrar,
  }
}
