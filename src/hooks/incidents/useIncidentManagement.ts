import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { useGetAssetsQuery } from '@/app/api/adminApi'
import { useDeleteIncidentMutation, useUpdateIncidentMutation } from '@/app/api/incidentsApi'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useConfirmedDeletion } from '@/hooks/useConfirmedDeletion'
import { runMutation, type SubmitResult } from '@/lib/apiErrors'
import { fromApiAssetToDomain } from '@/mappers/admin.mapper'
import { fromDomainIncidentEditToApi } from '@/mappers/incidents.mapper'
import type { IncidentEditValues } from '@/schemas/incident.schema'
import type { Incident } from '@/types/domain.types'
import { INCIDENT_STATUS } from '@/constants/domain.constants'
import { PERMISSIONS } from '@/constants/rbac.constants'

/**
 * Caso de uso: edición de una incidencia propia no cerrada (incidencia.editar_propias, sin relanzar la IA) y
 * eliminación física por el administrador (incidencia.eliminar; 409 si sustenta un riesgo evaluado o decidido).
 */
export function useIncidentManagement(incident: Incident | null) {
  const { currentUser, hasPermission } = useAuthSession()
  const canEdit =
    incident !== null &&
    incident.reporter.id === currentUser?.id &&
    incident.status !== INCIDENT_STATUS.CERRADA &&
    hasPermission(PERMISSIONS.INCIDENT_EDIT_OWN)
  const canDelete = incident !== null && hasPermission(PERMISSIONS.INCIDENT_DELETE)

  const assetsQuery = useGetAssetsQuery(undefined, { skip: !canEdit })
  const assets = useMemo(() => (assetsQuery.data ?? []).map(fromApiAssetToDomain).filter((a) => a.active), [assetsQuery.data])

  const [updateRequest, { isLoading: isUpdating }] = useUpdateIncidentMutation()
  const [deleteRequest] = useDeleteIncidentMutation()
  const deletion = useConfirmedDeletion((target: Incident) => deleteRequest(target.id).unwrap(), {
    fallback: 'No se pudo eliminar la incidencia.',
    successMessage: (target) => `Incidencia ${target.reference} eliminada`,
  })

  const updateIncident = useCallback(
    async (values: IncidentEditValues): Promise<SubmitResult> => {
      if (!incident) return undefined
      const { failure } = await runMutation(
        () => updateRequest({ id: incident.id, body: fromDomainIncidentEditToApi(values) }).unwrap(),
        'No se pudo actualizar la incidencia.',
      )
      if (!failure) toast.success(`Incidencia ${incident.reference} actualizada`)
      return failure
    },
    [incident, updateRequest],
  )

  return {
    assets,
    canEdit,
    canDelete,
    updateIncident,
    isUpdating,
    deletion,
  }
}
