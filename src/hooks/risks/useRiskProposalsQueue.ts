import { useMemo, useState } from 'react'
import { useGetRiskVersionsQuery } from '@/app/api/risksApi'
import { useAuthSession } from '@/hooks/useAuthSession'
import { toApiFailure } from '@/lib/apiErrors'
import { fromApiRiskVersionToDomain, fromDomainRiskFiltersToApi } from '@/mappers/risks.mapper'
import type { RiskInbox } from '@/types/domain.types'

export type ProposalsTab = Extract<RiskInbox, 'nuevas' | 'pendientes_revision' | 'rechazadas'>

export const PROPOSALS_TABS: { id: ProposalsTab; label: string }[] = [
  { id: 'nuevas', label: 'Nuevas agrupaciones' },
  { id: 'pendientes_revision', label: 'Pendientes de revisión' },
  { id: 'rechazadas', label: 'Rechazadas' },
]

/**
 * Caso de uso: bandeja de propuestas de riesgo (VERSION_RIESGO) clasificada por las bandejas del backend.
 * El ADMIN solo consulta (INV-05): `readOnly` desactiva cualquier acción de revisión.
 */
export function useRiskProposalsQueue(initialTab: ProposalsTab = 'nuevas') {
  const { roleCode, hasPermission } = useAuthSession()
  const [activeTab, setActiveTab] = useState<ProposalsTab>(initialTab)

  // Una consulta por bandeja para mostrar los contadores de todas las pestañas.
  const newQuery = useGetRiskVersionsQuery(fromDomainRiskFiltersToApi({ inbox: 'nuevas' }))
  const reviewQuery = useGetRiskVersionsQuery(fromDomainRiskFiltersToApi({ inbox: 'pendientes_revision' }))
  const rejectedQuery = useGetRiskVersionsQuery(fromDomainRiskFiltersToApi({ inbox: 'rechazadas' }))
  const queries = { nuevas: newQuery, pendientes_revision: reviewQuery, rechazadas: rejectedQuery }

  const active = queries[activeTab]
  const activeData = activeTab === 'nuevas' ? newQuery.data : activeTab === 'pendientes_revision' ? reviewQuery.data : rejectedQuery.data
  const proposals = useMemo(() => (activeData ?? []).map(fromApiRiskVersionToDomain), [activeData])
  const tabs = PROPOSALS_TABS.map((t) => ({ ...t, count: queries[t.id].data?.length }))

  return {
    activeTab,
    setActiveTab,
    tabs,
    proposals,
    readOnly: roleCode === 'ADMIN' || !hasPermission('riesgo.revisar_agrupacion'),
    isLoading: active.isLoading,
    loadError: active.error ? toApiFailure(active.error).message : null,
    retryLoad: () => active.refetch(),
  }
}
