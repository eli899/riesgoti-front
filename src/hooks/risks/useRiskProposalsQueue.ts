import { useMemo, useState } from 'react'
import { useGetRiskVersionsQuery } from '@/app/api/risksApi'
import { useAuthSession } from '@/hooks/useAuthSession'
import { toApiFailure } from '@/lib/apiErrors'
import { fromApiRiskVersionToDomain, fromDomainRiskFiltersToApi } from '@/mappers/risks.mapper'
import type { RiskInbox } from '@/types/domain.types'
import { PERMISSIONS, ROLES } from '@/constants/rbac.constants'
import { RISK_INBOXES } from '@/constants/domain.constants'

export type ProposalsTab = Exclude<RiskInbox, typeof RISK_INBOXES.DECIDED>

export const PROPOSALS_TABS: { id: ProposalsTab; label: string }[] = [
  { id: RISK_INBOXES.NEW, label: 'Nuevas agrupaciones' },
  { id: RISK_INBOXES.PENDING_REVIEW, label: 'Pendientes de revisión' },
  { id: RISK_INBOXES.REJECTED, label: 'Rechazadas' },
]

/**
 * Caso de uso: bandeja de propuestas de riesgo (VERSION_RIESGO) clasificada por las bandejas del backend.
 * El ADMIN solo consulta (INV-05): `readOnly` desactiva cualquier acción de revisión.
 */
export function useRiskProposalsQueue(initialTab: ProposalsTab = RISK_INBOXES.NEW) {
  const { roleCode, hasPermission } = useAuthSession()
  const [activeTab, setActiveTab] = useState<ProposalsTab>(initialTab)

  // Una consulta por bandeja para mostrar los contadores de todas las pestañas.
  const newQuery = useGetRiskVersionsQuery(fromDomainRiskFiltersToApi({ inbox: RISK_INBOXES.NEW }))
  const reviewQuery = useGetRiskVersionsQuery(fromDomainRiskFiltersToApi({ inbox: RISK_INBOXES.PENDING_REVIEW }))
  const rejectedQuery = useGetRiskVersionsQuery(fromDomainRiskFiltersToApi({ inbox: RISK_INBOXES.REJECTED }))
  const queries = { nuevas: newQuery, pendientes_revision: reviewQuery, rechazadas: rejectedQuery }

  const active = queries[activeTab]
  const activeData = activeTab === RISK_INBOXES.NEW ? newQuery.data : activeTab === RISK_INBOXES.PENDING_REVIEW ? reviewQuery.data : rejectedQuery.data
  const proposals = useMemo(() => (activeData ?? []).map(fromApiRiskVersionToDomain), [activeData])
  const tabs = PROPOSALS_TABS.map((t) => ({ ...t, count: queries[t.id].data?.length }))

  return {
    activeTab,
    setActiveTab,
    tabs,
    proposals,
    readOnly: roleCode === ROLES.ADMIN || !hasPermission(PERMISSIONS.RISK_REVIEW_GROUPING),
    isLoading: active.isLoading,
    loadError: active.error ? toApiFailure(active.error).message : null,
    retryLoad: () => active.refetch(),
  }
}
