import { useMemo, useState } from 'react'
import { useGetRiskDashboardQuery, useGetRiskVersionsQuery } from '@/app/api/risksApi'
import { toApiFailure } from '@/lib/apiErrors'
import { fromApiRiskDashboardToDomain, fromApiRiskVersionToDomain, toRiskRegistryRows } from '@/mappers/risks.mapper'
import type { RiskRegistryCategory } from '@/types/domain.types'
import { RISK_REGISTRY_CATEGORY } from '@/constants/domain.constants'

export const REGISTRY_TABS: { id: RiskRegistryCategory; label: string }[] = [
  { id: RISK_REGISTRY_CATEGORY.VALIDADO, label: 'Riesgos validados' },
  { id: RISK_REGISTRY_CATEGORY.PENDIENTE, label: 'Propuestas pendientes' },
  { id: RISK_REGISTRY_CATEGORY.RECHAZADO, label: 'Rechazados' },
]

/**
 * Caso de uso: registro de riesgos (una fila por RIESGO con su versión validada vigente) e indicadores del tablero
 * (GET /risks/dashboard/), sin duplicar riesgos con varias versiones.
 */
export function useRiskRegistryAndDashboard() {
  const [activeTab, setActiveTab] = useState<RiskRegistryCategory>(RISK_REGISTRY_CATEGORY.VALIDADO)
  const dashboardQuery = useGetRiskDashboardQuery(undefined, { refetchOnMountOrArgChange: true })
  const versionsQuery = useGetRiskVersionsQuery(undefined, { refetchOnMountOrArgChange: true })

  const dashboard = useMemo(() => (dashboardQuery.data ? fromApiRiskDashboardToDomain(dashboardQuery.data) : null), [dashboardQuery.data])
  const rows = useMemo(
    () => (dashboard ? toRiskRegistryRows(dashboard, (versionsQuery.data ?? []).map(fromApiRiskVersionToDomain)) : []),
    [dashboard, versionsQuery.data],
  )

  const tabs = REGISTRY_TABS.map((t) => ({ ...t, count: rows.filter((r) => r.category === t.id).length }))
  const error = dashboardQuery.error ?? versionsQuery.error

  return {
    dashboard,
    activeTab,
    setActiveTab,
    tabs,
    rows: rows.filter((r) => r.category === activeTab),
    isLoading: dashboardQuery.isLoading || versionsQuery.isLoading,
    loadError: error ? toApiFailure(error).message : null,
    retryLoad: () => {
      dashboardQuery.refetch()
      versionsQuery.refetch()
    },
  }
}
