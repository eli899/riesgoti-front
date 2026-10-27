import { useMemo } from 'react'
import { useGetRiskVersionsQuery } from '@/app/api/risksApi'
import { useAuthSession } from '@/hooks/useAuthSession'
import { toApiFailure } from '@/lib/apiErrors'
import { fromApiRiskVersionToDomain, fromDomainRiskFiltersToApi } from '@/mappers/risks.mapper'
import { RISK_VALIDATION_STATUS } from '@/constants/domain.constants'
import { PERMISSIONS, ROLES } from '@/constants/rbac.constants'

/**
 * Caso de uso: historial de VERSION_RIESGO de un RIESGO (más reciente primero), su versión validada vigente y la
 * versión pendiente, para el detalle del riesgo y el comparador «Antes · v{base}» / «Después · v{actual}».
 */
export function useRiskVersionCompare(riskId: number | null) {
  const { roleCode, hasPermission } = useAuthSession()
  const query = useGetRiskVersionsQuery(fromDomainRiskFiltersToApi({ riskId: riskId ?? undefined }), { skip: riskId === null })

  const versions = useMemo(() => (query.data ?? []).map(fromApiRiskVersionToDomain).sort((a, b) => b.number - a.number), [query.data])
  const validated = versions.find((v) => v.status === RISK_VALIDATION_STATUS.VALIDADA) ?? null
  const pending = versions.find((v) => v.status === RISK_VALIDATION_STATUS.PENDIENTE) ?? null

  return {
    versions,
    validated,
    pending,
    /** Versión que representa al riesgo: la validada vigente o, si no existe, la más reciente. */
    shown: validated ?? versions[0] ?? null,
    canReview: roleCode !== ROLES.ADMIN && hasPermission(PERMISSIONS.RISK_REVIEW_GROUPING),
    isLoading: query.isLoading,
    notFound: !query.isLoading && !query.error && riskId !== null && versions.length === 0,
    loadError: query.error ? toApiFailure(query.error).message : null,
    retryLoad: () => query.refetch(),
  }
}
