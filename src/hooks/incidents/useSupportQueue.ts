import { useDeferredValue, useMemo, useState } from 'react'
import { useGetAssetsQuery } from '@/app/api/adminApi'
import { useGetIncidentsQuery } from '@/app/api/incidentsApi'
import { toApiFailure } from '@/lib/apiErrors'
import { fromApiAssetToDomain } from '@/mappers/admin.mapper'
import { fromApiIncidentToDomain, fromDomainIncidentFiltersToApi } from '@/mappers/incidents.mapper'
import type { IncidentStatus } from '@/types/domain.types'
import { FILTER_ALL, SUPPORT_VIEW_MODES, type FilterAll, type SupportViewMode } from '@/constants/ui.constants'
import { POLLING_INTERVALS_MS } from '@/constants/timing.constants'

export type SupportListMode = SupportViewMode
export type AgeFilter = FilterAll | '1' | '7' | '30'

export interface SupportListFilters {
  status: IncidentStatus | FilterAll
  assetId: number | FilterAll
  age: AgeFilter
  search: string
}

const EMPTY_FILTERS: SupportListFilters = { status: FILTER_ALL, assetId: FILTER_ALL, age: FILTER_ALL, search: '' }

/**
 * Caso de uso: cola N2 (bandeja=atencion, más antiguos primero, refresco cada 15 s) o historial general
 * (más recientes primero). Los filtros se resuelven en el backend (IncidentFilter).
 */
export function useSupportQueue(mode: SupportListMode) {
  const [filters, setFilters] = useState<SupportListFilters>(EMPTY_FILTERS)
  const deferredSearch = useDeferredValue(filters.search)

  const params = fromDomainIncidentFiltersToApi({
    attentionQueue: mode === SUPPORT_VIEW_MODES.QUEUE,
    statuses: filters.status === FILTER_ALL ? undefined : [filters.status],
    assetId: filters.assetId === FILTER_ALL ? undefined : filters.assetId,
    maxAgeDays: filters.age === FILTER_ALL ? undefined : Number(filters.age),
    search: deferredSearch,
    ordering: mode === SUPPORT_VIEW_MODES.QUEUE ? 'registrada_en' : '-registrada_en',
  })
  const listQuery = useGetIncidentsQuery(params, { pollingInterval: mode === SUPPORT_VIEW_MODES.QUEUE ? POLLING_INTERVALS_MS.SUPPORT_QUEUE : 0, skipPollingIfUnfocused: true })
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
