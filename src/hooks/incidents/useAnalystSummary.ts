import { useMemo, useState } from 'react'
import { useGetAssetsQuery } from '@/app/api/adminApi'
import { useGetIncidentsQuery } from '@/app/api/incidentsApi'
import { useGetRiskDashboardQuery, useGetRiskVersionsQuery } from '@/app/api/risksApi'
import { toApiFailure } from '@/lib/apiErrors'
import { fromApiAssetToDomain } from '@/mappers/admin.mapper'
import { fromApiIncidentToDomain } from '@/mappers/incidents.mapper'
import { fromApiRiskDashboardToDomain, fromApiRiskVersionToDomain } from '@/mappers/risks.mapper'

export type SummaryPeriod = '7' | '30' | 'all'

const DAY_MS = 864e5
const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Caso de uso: resumen operativo del Analista (incidencias por periodo/activo + indicadores de riesgo). */
export function useAnalystSummary() {
  const [period, setPeriod] = useState<SummaryPeriod>('30')
  const [assetId, setAssetId] = useState<number | 'all'>('all')
  // Instante de referencia fijado al montar la vista (los periodos se cuentan desde aquí).
  const [now] = useState(() => Date.now())

  const incidentsQuery = useGetIncidentsQuery({ ordering: '-registrada_en' })
  const dashboardQuery = useGetRiskDashboardQuery()
  const pendingQuery = useGetRiskVersionsQuery({ estado: 'PENDIENTE' })
  const assetsQuery = useGetAssetsQuery()

  const incidents = useMemo(() => (incidentsQuery.data ?? []).map(fromApiIncidentToDomain), [incidentsQuery.data])
  const dashboard = useMemo(() => (dashboardQuery.data ? fromApiRiskDashboardToDomain(dashboardQuery.data) : null), [dashboardQuery.data])
  const pendingVersions = useMemo(() => (pendingQuery.data ?? []).map(fromApiRiskVersionToDomain), [pendingQuery.data])
  const assets = useMemo(() => (assetsQuery.data ?? []).map(fromApiAssetToDomain), [assetsQuery.data])

  const summary = useMemo(() => {
    const inPeriod = incidents.filter((i) => period === 'all' || now - new Date(i.registeredAt).getTime() < Number(period) * DAY_MS)
    const filtered = inPeriod.filter((i) => assetId === 'all' || i.assetId === assetId)
    const queue = incidents.filter((i) => i.status === 'PENDIENTE_ATENCION_HUMANA' || i.status === 'EN_ATENCION')

    const days = period === 'all' ? Math.max(30, Math.ceil((now - Math.min(...incidents.map((i) => new Date(i.registeredAt).getTime()), now)) / DAY_MS) + 1) : Number(period)
    const counts = new Map<string, number>()
    for (const i of filtered) counts.set(isoDay(new Date(i.registeredAt)), (counts.get(isoDay(new Date(i.registeredAt))) ?? 0) + 1)
    const series = Array.from({ length: Math.min(days, 90) }, (_, k) => {
      const d = new Date(now - (Math.min(days, 90) - 1 - k) * DAY_MS)
      return { date: isoDay(d), total: counts.get(isoDay(d)) ?? 0 }
    })

    const byAsset = [...filtered.reduce((m, i) => m.set(i.assetName ?? 'Activo fuera del catálogo', (m.get(i.assetName ?? 'Activo fuera del catálogo') ?? 0) + 1), new Map<string, number>())]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    return {
      periodCount: filtered.length,
      queueCount: queue.length,
      autoResolved: filtered.filter((i) => i.status === 'CERRADA' && i.guidanceResult === 'FUNCIONO').length,
      humanResolved: filtered.filter((i) => i.status === 'CERRADA' && i.guidanceResult !== 'FUNCIONO').length,
      series,
      byAsset,
    }
  }, [incidents, period, assetId, now])

  const error = incidentsQuery.error ?? dashboardQuery.error
  return {
    period,
    setPeriod,
    assetId,
    setAssetId,
    assets: assets.filter((a) => a.active),
    summary,
    dashboard,
    pendingVersions,
    isLoading: incidentsQuery.isLoading || dashboardQuery.isLoading,
    loadError: error ? toApiFailure(error).message : null,
    retryLoad: () => {
      incidentsQuery.refetch()
      dashboardQuery.refetch()
      pendingQuery.refetch()
    },
  }
}
