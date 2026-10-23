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

/** Mientras alguna incidencia propia espera su orientación, la bandeja se refresca sola. */
export const REPORTER_LIST_POLLING_MS = 5000

const isAwaitingGuidance = (i: Incident) =>
  i.status === 'REGISTRADA' || (i.status === 'EN_ANALISIS' && i.operationalTaskStatus !== 'COMPLETADA' && i.operationalTaskStatus !== 'ERROR')

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

  useGetIncidentsQuery(params, { skip: !currentUser || !hasPending, pollingInterval: hasPending ? REPORTER_LIST_POLLING_MS : 0 })

  const stats = useMemo(
    () => ({
      total: incidents.length,
      inAnalysis: incidents.filter((i) => i.status === 'REGISTRADA' || i.status === 'EN_ANALISIS').length,
      awaitingHuman: incidents.filter((i) => i.status === 'PENDIENTE_ATENCION_HUMANA' || i.status === 'EN_ATENCION').length,
      closed: incidents.filter((i) => i.status === 'CERRADA').length,
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
    canReport: hasPermission('incidencia.crear'),
    isLoading: listQuery.isLoading,
    loadError: listQuery.error ? toApiFailure(listQuery.error).message : null,
    retryLoad: listQuery.refetch,
    reportIncident,
    isCreating,
  }
}
