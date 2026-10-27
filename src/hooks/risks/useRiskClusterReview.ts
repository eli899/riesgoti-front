import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { useGetAssetsQuery } from '@/app/api/adminApi'
import {
  useConfirmRiskGroupingMutation,
  useGetRiskVersionQuery,
  useRemoveIncidentFromRiskGroupMutation,
  useRestoreIncidentToRiskGroupMutation,
} from '@/app/api/risksApi'
import { useAuthSession } from '@/hooks/useAuthSession'
import { runMutation, toApiFailure, type SubmitResult } from '@/lib/apiErrors'
import { fromApiAssetToDomain } from '@/mappers/admin.mapper'
import { fromApiRiskVersionToDomain, fromDomainConfirmGroupingToApi, fromDomainRemoveIncidentToApi } from '@/mappers/risks.mapper'
import type { ConfirmGroupingValues, RemoveIncidentFromGroupValues } from '@/schemas/riskEvaluation.schema'
import type { RiskLinkedIncident } from '@/types/domain.types'
import { INCIDENT_LINK_STATUS, RISK_VALIDATION_STATUS } from '@/constants/domain.constants'
import { PERMISSIONS, ROLES } from '@/constants/rbac.constants'

/**
 * Caso de uso: depuración de la agrupación IA de una VERSION_RIESGO pendiente. Retirar o restaurar un vínculo
 * conserva la fila de VERSION_INCIDENCIA y reinicia la confirmación de la agrupación en el backend.
 */
export function useRiskClusterReview(versionId: number | null) {
  const { roleCode, hasPermission } = useAuthSession()
  const skip = versionId === null

  const versionQuery = useGetRiskVersionQuery(versionId ?? 0, { skip })
  const version = useMemo(() => (versionQuery.data ? fromApiRiskVersionToDomain(versionQuery.data) : null), [versionQuery.data])

  const assetsQuery = useGetAssetsQuery()
  const assets = useMemo(() => (assetsQuery.data ?? []).map(fromApiAssetToDomain), [assetsQuery.data])

  const [removeIncident, { isLoading: isRemoving }] = useRemoveIncidentFromRiskGroupMutation()
  const [restoreIncident, { isLoading: isRestoring, originalArgs: restoringArgs }] = useRestoreIncidentToRiskGroupMutation()
  const [confirmGrouping, { isLoading: isConfirming }] = useConfirmRiskGroupingMutation()

  const isReadOnlyRole = roleCode === ROLES.ADMIN
  const canReview = !isReadOnlyRole && hasPermission(PERMISSIONS.RISK_REVIEW_GROUPING) && version?.status === RISK_VALIDATION_STATUS.PENDIENTE

  const included = useMemo(() => version?.incidents.filter((i) => i.linkStatus !== INCIDENT_LINK_STATUS.RETIRADA) ?? [], [version])
  const excluded = useMemo(() => version?.incidents.filter((i) => i.linkStatus === INCIDENT_LINK_STATUS.RETIRADA) ?? [], [version])

  // El contrato de VERSION_INCIDENCIA expone el nombre del activo reportado; se resuelve contra el catálogo.
  const reportedAssetIds = useMemo(() => {
    const names = new Set(included.map((i) => i.assetName).filter(Boolean))
    return assets.filter((a) => names.has(a.name)).map((a) => a.id)
  }, [assets, included])

  const remove = useCallback(
    async (incident: RiskLinkedIncident, values: RemoveIncidentFromGroupValues): Promise<SubmitResult> => {
      if (versionId === null) return undefined
      const { failure } = await runMutation(() =>
        removeIncident({ id: versionId, analisisId: incident.analysisId, body: fromDomainRemoveIncidentToApi(values) }).unwrap(),
      )
      if (failure) return failure
      toast.success(`${incident.reference} retirada de la agrupación`, { description: 'El vínculo se conserva como excluido con su motivo.' })
      return undefined
    },
    [removeIncident, versionId],
  )

  const restore = useCallback(
    async (incident: RiskLinkedIncident) => {
      if (versionId === null) return
      const { failure } = await runMutation(() => restoreIncident({ id: versionId, analisisId: incident.analysisId }).unwrap())
      if (failure) toast.error('No se pudo restaurar la incidencia', { description: failure.message })
      else toast.success(`${incident.reference} restaurada a la agrupación`)
    },
    [restoreIncident, versionId],
  )

  const confirm = useCallback(
    async (values: ConfirmGroupingValues): Promise<SubmitResult> => {
      if (versionId === null) return undefined
      const { failure } = await runMutation(() => confirmGrouping({ id: versionId, body: fromDomainConfirmGroupingToApi(values) }).unwrap())
      if (failure) return failure
      toast.success('Agrupación confirmada', { description: 'El activo afectado y las incidencias incluidas quedaron confirmados.' })
      return undefined
    },
    [confirmGrouping, versionId],
  )

  return {
    version,
    isLoading: versionQuery.isLoading,
    loadError: versionQuery.error ? toApiFailure(versionQuery.error).message : null,
    notFound: (versionQuery.error as { status?: number } | undefined)?.status === 404,
    retryLoad: () => versionQuery.refetch(),
    isReadOnlyRole,
    canReview,
    included,
    excluded,
    assets: assets.filter((a) => a.active),
    reportedAssetIds,
    removeIncident: remove,
    isRemoving,
    restoreIncident: restore,
    restoringAnalysisId: isRestoring ? restoringArgs?.analisisId ?? null : null,
    confirmGrouping: confirm,
    isConfirming,
  }
}
