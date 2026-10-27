import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { useGetAssetsQuery } from '@/app/api/adminApi'
import {
  useDownloadEvidenceMutation,
  useGetIncidentQuery,
  useGetOperationalGuidanceQuery,
  useRetryStrategicAnalysisMutation,
  useStartHumanAttentionMutation,
  useUpdateHumanAttentionMutation,
} from '@/app/api/incidentsApi'
import { useAuthSession } from '@/hooks/useAuthSession'
import { runMutation, toApiFailure, type SubmitResult } from '@/lib/apiErrors'
import { fromApiAssetToDomain } from '@/mappers/admin.mapper'
import { fromApiGuidanceToDomain, fromApiIncidentDetailToDomain, fromDomainAttentionToApi } from '@/mappers/incidents.mapper'
import type { HumanAttentionFormValues } from '@/schemas/incident.schema'
import type { Evidence } from '@/types/domain.types'
import { AI_TASK_RUNNING_STATUSES, AI_TASK_STATUS } from '@/constants/domain.constants'
import { PERMISSIONS } from '@/constants/rbac.constants'
import { POLLING_INTERVALS_MS } from '@/constants/timing.constants'

/**
 * Caso de uso de la consola N2: contexto completo del caso derivado (reporte, evidencias, orientación IA previa),
 * atención humana (iniciar / guardar avance / cerrar) y reintento de la rama estratégica. Cerrar el caso no
 * decide el riesgo asociado ni inyecta las notas al índice RAG (INV-02, INV-03).
 */
export function useSupportCaseAttention(incidentId: number | null) {
  const { currentUser, hasPermission } = useAuthSession()
  const skip = incidentId === null

  const detailQuery = useGetIncidentQuery(incidentId ?? 0, { skip })
  const incident = useMemo(() => (detailQuery.data ? fromApiIncidentDetailToDomain(detailQuery.data) : null), [detailQuery.data])
  const strategicStatus = incident?.aiTasks.strategic?.status
  const strategicRunning = strategicStatus != null && AI_TASK_RUNNING_STATUSES.includes(strategicStatus)
  useGetIncidentQuery(incidentId ?? 0, { skip: skip || !strategicRunning, pollingInterval: strategicRunning ? POLLING_INTERVALS_MS.STRATEGIC_ANALYSIS : 0 })

  const guidanceQuery = useGetOperationalGuidanceQuery(incidentId ?? 0, { skip })
  const guidance = useMemo(() => (guidanceQuery.data ? fromApiGuidanceToDomain(guidanceQuery.data) : null), [guidanceQuery.data])

  const assetsQuery = useGetAssetsQuery()
  const asset = useMemo(() => {
    const dto = assetsQuery.data?.find((a) => a.id === incident?.assetId)
    return dto ? fromApiAssetToDomain(dto) : null
  }, [assetsQuery.data, incident?.assetId])

  const [startAttention, { isLoading: isStarting }] = useStartHumanAttentionMutation()
  const [updateAttention, { isLoading: isSaving }] = useUpdateHumanAttentionMutation()
  const [retryStrategic, { isLoading: isRetrying }] = useRetryStrategicAnalysisMutation()
  const [downloadEvidence] = useDownloadEvidenceMutation()

  const canAttend = hasPermission(PERMISSIONS.ATTENTION_ATTEND)
  const assignedToMe = incident?.attention?.analyst.id === currentUser?.id

  const start = useCallback(async () => {
    if (incidentId === null) return
    const { failure } = await runMutation(() => startAttention(incidentId).unwrap())
    if (failure) toast.error('No se pudo iniciar la atención', { description: failure.message })
    else toast.success('Atención iniciada', { description: 'El caso quedó asignado a ti y en estado En atención.' })
  }, [incidentId, startAttention])

  const saveAttention = useCallback(
    async (values: HumanAttentionFormValues): Promise<SubmitResult> => {
      if (incidentId === null) return undefined
      const { failure } = await runMutation(() => updateAttention({ id: incidentId, body: fromDomainAttentionToApi(values) }).unwrap())
      if (failure) return failure
      if (values.cerrar) toast.success('Incidencia cerrada', { description: 'El cierre operativo no valida ni rechaza el riesgo asociado.' })
      else toast.success('Avance guardado', { description: 'La incidencia sigue en atención.' })
      return undefined
    },
    [incidentId, updateAttention],
  )

  const retryStrategicAnalysis = useCallback(async () => {
    if (incidentId === null) return
    const { failure } = await runMutation(() => retryStrategic(incidentId).unwrap())
    if (failure) toast.error('No se pudo reintentar el análisis', { description: failure.message })
    else toast.success('Análisis de riesgo reencolado', { description: 'Se creó un nuevo intento de la rama estratégica.' })
  }, [incidentId, retryStrategic])

  const download = useCallback(
    async (evidence: Evidence) => {
      if (incidentId === null) return
      const { failure } = await runMutation(() => downloadEvidence({ incidentId, evidenceId: evidence.id, fileName: evidence.originalName }).unwrap())
      if (failure) toast.error('No se pudo descargar la evidencia', { description: failure.message })
    },
    [downloadEvidence, incidentId],
  )

  const error = detailQuery.error ?? guidanceQuery.error
  return {
    incident,
    guidance,
    asset,
    isLoading: detailQuery.isLoading || guidanceQuery.isLoading,
    loadError: error ? toApiFailure(error).message : null,
    notFound: (detailQuery.error as { status?: number } | undefined)?.status === 404,
    retryLoad: () => {
      detailQuery.refetch()
      guidanceQuery.refetch()
    },
    canAttend,
    assignedToMe,
    canRetryStrategic: canAttend && strategicStatus === AI_TASK_STATUS.ERROR,
    start,
    isStarting,
    saveAttention,
    isSaving,
    retryStrategicAnalysis,
    isRetrying,
    downloadEvidence: download,
  }
}
