import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { useDownloadEvidenceMutation, useGetIncidentQuery, useGetOperationalGuidanceQuery, useSubmitOrientationFeedbackMutation } from '@/app/api/incidentsApi'
import { useAuthSession } from '@/hooks/useAuthSession'
import { runMutation, toApiFailure } from '@/lib/apiErrors'
import { fromApiGuidanceToDomain, fromApiIncidentDetailToDomain, fromDomainOrientationFeedbackToApi } from '@/mappers/incidents.mapper'
import type { AITaskStatus, Evidence, GuidanceResult } from '@/types/domain.types'

export const GUIDANCE_POLLING_MS = 2500
export const STRATEGIC_POLLING_MS = 5000

const isRunning = (status: AITaskStatus | null | undefined) => status === 'PENDIENTE' || status === 'PROCESANDO'

/**
 * Caso de uso: detalle de una incidencia + orientación operativa RAG con polling de 2,5 s mientras la TAREA_IA
 * operativa no termine, y confirmación del reportante (FUNCIONO / NO_FUNCIONO). La rama estratégica se sigue
 * mostrando y refrescando de forma independiente (INV-02).
 */
export function useOperationalGuidance(incidentId: number | null) {
  const { currentUser, hasPermission } = useAuthSession()
  const skip = incidentId === null

  const guidanceQuery = useGetOperationalGuidanceQuery(incidentId ?? 0, { skip })
  const guidance = useMemo(() => (guidanceQuery.data ? fromApiGuidanceToDomain(guidanceQuery.data) : null), [guidanceQuery.data])
  const guidancePending = !guidance || guidance.isPending
  useGetOperationalGuidanceQuery(incidentId ?? 0, { skip: skip || !guidancePending, pollingInterval: guidancePending ? GUIDANCE_POLLING_MS : 0 })

  const detailQuery = useGetIncidentQuery(incidentId ?? 0, { skip })
  const incident = useMemo(() => (detailQuery.data ? fromApiIncidentDetailToDomain(detailQuery.data) : null), [detailQuery.data])
  const strategicPending = !incident || incident.aiTasks.strategic === null || isRunning(incident.aiTasks.strategic.status)
  // El detalle acompaña a la orientación mientras esta corre y luego sigue, más lento, a la rama estratégica.
  const detailInterval = guidancePending ? GUIDANCE_POLLING_MS : strategicPending ? STRATEGIC_POLLING_MS : 0
  useGetIncidentQuery(incidentId ?? 0, { skip: skip || detailInterval === 0, pollingInterval: detailInterval })

  const [submitFeedback, { isLoading: isSubmittingFeedback }] = useSubmitOrientationFeedbackMutation()
  const [downloadEvidenceRequest] = useDownloadEvidenceMutation()

  const downloadEvidence = useCallback(
    async (evidence: Evidence) => {
      if (incidentId === null) return
      const { failure } = await runMutation(() => downloadEvidenceRequest({ incidentId, evidenceId: evidence.id, fileName: evidence.originalName }).unwrap())
      if (failure) toast.error('No se pudo descargar la evidencia', { description: failure.message })
    },
    [downloadEvidenceRequest, incidentId],
  )

  const isOwner = incident !== null && incident.reporter.id === currentUser?.id
  const canGiveFeedback =
    isOwner &&
    hasPermission('incidencia.cerrar_propias_por_feedback') &&
    incident?.status === 'EN_ANALISIS' &&
    guidance?.guidance?.type === 'SUGERENCIA' &&
    !guidance.guidance.response

  const sendFeedback = useCallback(
    async (result: GuidanceResult) => {
      if (incidentId === null) return
      const { failure } = await runMutation(() => submitFeedback({ id: incidentId, body: fromDomainOrientationFeedbackToApi({ resultado: result }) }).unwrap())
      if (failure) {
        toast.error('No se pudo registrar tu respuesta', { description: failure.message })
        return
      }
      if (result === 'FUNCIONO') toast.success('Incidencia cerrada', { description: 'Gracias por confirmarlo. El análisis de riesgo continúa de forma independiente.' })
      else toast.success('Caso escalado a un analista', { description: 'Un analista N2 revisará tu caso con los pasos que ya intentaste.' })
    },
    [incidentId, submitFeedback],
  )

  const error = detailQuery.error ?? guidanceQuery.error
  return {
    incident,
    guidance,
    isLoading: detailQuery.isLoading || guidanceQuery.isLoading,
    loadError: error ? toApiFailure(error).message : null,
    notFound: (detailQuery.error as { status?: number } | undefined)?.status === 404,
    retryLoad: () => {
      detailQuery.refetch()
      guidanceQuery.refetch()
    },
    guidancePending,
    strategicPending,
    canGiveFeedback,
    sendFeedback,
    isSubmittingFeedback,
    downloadEvidence,
  }
}
