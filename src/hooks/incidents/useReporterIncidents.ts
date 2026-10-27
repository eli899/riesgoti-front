import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { useGetAssetsQuery } from '@/app/api/adminApi'
import { useCreateIncidentMutation, useGetIncidentsQuery } from '@/app/api/incidentsApi'
import { useAuthSession } from '@/hooks/useAuthSession'
import { runMutation, toApiFailure, type ApiFailure } from '@/lib/apiErrors'
import { fromApiAssetToDomain } from '@/mappers/admin.mapper'
import { fromApiIncidentToDomain, fromDomainIncidentFiltersToApi, fromDomainIncidentToApi } from '@/mappers/incidents.mapper'
import type { IncidentFormValues } from '@/schemas/incident.schema'
import type { Incident } from '@/types/domain.types'
import { AI_TASK_STATUS, INCIDENT_AUTOMATED_STATUSES, INCIDENT_HUMAN_QUEUE_STATUSES, INCIDENT_STATUS } from '@/constants/domain.constants'
import { PERMISSIONS } from '@/constants/rbac.constants'
import { POLLING_INTERVALS_MS } from '@/constants/timing.constants'

/** Mientras alguna incidencia propia espera su orientación, la bandeja se refresca sola. */

const isAwaitingGuidance = (i: Incident) =>
  i.status === INCIDENT_STATUS.REGISTRADA ||
  (i.status === INCIDENT_STATUS.EN_ANALISIS && i.operationalTaskStatus !== AI_TASK_STATUS.COMPLETADA && i.operationalTaskStatus !== AI_TASK_STATUS.ERROR)

/** Caso de uso del Reportante: sus incidencias, indicadores y registro de nuevas incidencias con evidencias. */
export function useReporterIncidents() {
  const { currentUser, hasPermission } = useAuthSession()
  const params = fromDomainIncidentFiltersToApi({ reporterId: currentUser?.id })
  const listQuery = useGetIncidentsQuery(params, { skip: !currentUser })
  const assetsQuery = useGetAssetsQuery()
  const [createIncident, { isLoading: isCreating }] = useCreateIncidentMutation()

  const incidents = useMemo(() => (listQuery.data ?? []).map(fromApiIncidentToDomain), [listQuery.data])
  const assets = useMemo(() => (assetsQuery.data ?? []).map(fromApiAssetToDomain).filter((a) => a.active), [assetsQuery.data])
  const hasPending = incidents.some(isAwaitingGuidance)

  useGetIncidentsQuery(params, { skip: !currentUser || !hasPending, pollingInterval: hasPending ? POLLING_INTERVALS_MS.REPORTER_LIST : 0 })

  const stats = useMemo(
    () => ({
      total: incidents.length,
      inAnalysis: incidents.filter((i) => INCIDENT_AUTOMATED_STATUSES.includes(i.status)).length,
      awaitingHuman: incidents.filter((i) => INCIDENT_HUMAN_QUEUE_STATUSES.includes(i.status)).length,
      closed: incidents.filter((i) => i.status === INCIDENT_STATUS.CERRADA).length,
    }),
    [incidents],
  )

  /** Registra la incidencia (transaccional en backend) y devuelve su id para abrir el detalle de inmediato. */
  const reportIncident = useCallback(
    async (values: IncidentFormValues): Promise<{ failure?: ApiFailure; incidentId?: number }> => {
      const { data, failure } = await runMutation(() => createIncident(fromDomainIncidentToApi(values)).unwrap(), 'No se pudo registrar la incidencia.')
      if (failure) return { failure }
      toast.success(`Incidencia ${data!.referencia} registrada`, { description: 'Estamos preparando una orientación para tu caso.' })
      return { incidentId: data!.id }
    },
    [createIncident],
  )

  return {
    incidents,
    assets,
    stats,
    canReport: hasPermission(PERMISSIONS.INCIDENT_CREATE),
    isLoading: listQuery.isLoading,
    loadError: listQuery.error ? toApiFailure(listQuery.error).message : null,
    retryLoad: listQuery.refetch,
    reportIncident,
    isCreating,
  }
}
