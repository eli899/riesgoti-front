import { useDeferredValue, useMemo, useState } from 'react'
import { useGetAssetsQuery } from '@/app/api/adminApi'
import { useGetIncidentsQuery } from '@/app/api/incidentsApi'
import { toApiFailure } from '@/lib/apiErrors'
import { fromApiAssetToDomain } from '@/mappers/admin.mapper'
import { fromApiIncidentToDomain, fromDomainIncidentFiltersToApi } from '@/mappers/incidents.mapper'
import type { IncidentStatus } from '@/types/domain.types'

export type SupportListMode = 'queue' | 'all'
export type AgeFilter = 'all' | '1' | '7' | '30'

export interface SupportListFilters {
  status: IncidentStatus | 'all'
  assetId: number | 'all'
  age: AgeFilter
  search: string
}

export const QUEUE_POLLING_MS = 15000
const EMPTY_FILTERS: SupportListFilters = { status: 'all', assetId: 'all', age: 'all', search: '' }

/**
 * Caso de uso: cola N2 (bandeja=atencion, más antiguos primero, refresco cada 15 s) o historial general
 * (más recientes primero). Los filtros se resuelven en el backend (IncidentFilter).
 */
export function useSupportQueue(mode: SupportListMode) {
  const [filters, setFilters] = useState<SupportListFilters>(EMPTY_FILTERS)
  const deferredSearch = useDeferredValue(filters.search)

  const params = fromDomainIncidentFiltersToApi({
    attentionQueue: mode === 'queue',
    statuses: filters.status === 'all' ? undefined : [filters.status],
    assetId: filters.assetId === 'all' ? undefined : filters.assetId,
    maxAgeDays: filters.age === 'all' ? undefined : Number(filters.age),
    search: deferredSearch,
    ordering: mode === 'queue' ? 'registrada_en' : '-registrada_en',
  })
  const listQuery = useGetIncidentsQuery(params, { pollingInterval: mode === 'queue' ? QUEUE_POLLING_MS : 0, skipPollingIfUnfocused: true })
  const assetsQuery = useGetAssetsQuery()

  const incidents = useMemo(() => (listQuery.data ?? []).map(fromApiIncidentToDomain), [listQuery.data])
  const assets = useMemo(() => (assetsQuery.data ?? []).map(fromApiAssetToDomain), [assetsQuery.data])

  const updateFilters = (patch: Partial<SupportListFilters>) => setFilters((prev) => ({ ...prev, ...patch }))
  const isFiltered = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS)

  return {
    mode,
    incidents,
    assets,
    filters,
    updateFilters,
    resetFilters: () => setFilters(EMPTY_FILTERS),
    isFiltered,
    isLoading: listQuery.isLoading,
    isRefreshing: listQuery.isFetching && !listQuery.isLoading,
    loadError: listQuery.error ? toApiFailure(listQuery.error).message : null,
    retryLoad: listQuery.refetch,
  }
}
