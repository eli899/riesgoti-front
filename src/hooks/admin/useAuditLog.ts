import { useCallback, useMemo, useState } from 'react'
import { useGetAuditEventsQuery } from '@/app/api/adminApi'
import { toApiFailure } from '@/lib/apiErrors'
import { fromApiAuditEventPageToDomain, fromDomainAuditFiltersToApi } from '@/mappers/admin.mapper'
import type { AuditEventFilters } from '@/types/domain.types'

/** Caso de uso: bitácora de EVENTO_AUDITORIA paginada (50 por página) con filtro por acción y búsqueda en el detalle. */
export function useAuditLog() {
  const [filters, setFilters] = useState<AuditEventFilters>({ page: 1 })
  const query = useGetAuditEventsQuery(fromDomainAuditFiltersToApi(filters))
  const page = useMemo(() => (query.data ? fromApiAuditEventPageToDomain(query.data) : null), [query.data])

  const setAction = useCallback((action: string) => setFilters((f) => ({ ...f, action: action || undefined, page: 1 })), [])
  const setSearch = useCallback((search: string) => setFilters((f) => ({ ...f, search: search || undefined, page: 1 })), [])
  const setPage = useCallback((p: number) => setFilters((f) => ({ ...f, page: p })), [])

  return {
    filters,
    events: page?.events ?? [],
    total: page?.total ?? 0,
    pages: page?.pages ?? 1,
    setAction,
    setSearch,
    setPage,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    loadError: query.error ? toApiFailure(query.error).message : null,
    retryLoad: () => query.refetch(),
  }
}
