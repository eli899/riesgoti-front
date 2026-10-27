import { useMemo } from 'react'
import { useGetDocumentVersionsQuery, useGetActiveAIConfigQuery } from '@/app/api/adminApi'
import { useGetRiskDashboardQuery } from '@/app/api/risksApi'
import { toApiFailure } from '@/lib/apiErrors'
import { fromApiAIConfigToDomain, fromApiDocumentVersionToDomain } from '@/mappers/admin.mapper'
import { fromApiRiskDashboardToDomain } from '@/mappers/risks.mapper'
import { DOCUMENT_PROCESSING_STATUS } from '@/constants/domain.constants'

/** Caso de uso: panorama del administrador (indicadores agregados + estado de la base de conocimiento e IA). */
export function useAdminOverview() {
  const dashboardQuery = useGetRiskDashboardQuery()
  const docsQuery = useGetDocumentVersionsQuery()
  const configQuery = useGetActiveAIConfigQuery()

  const dashboard = useMemo(() => (dashboardQuery.data ? fromApiRiskDashboardToDomain(dashboardQuery.data) : null), [dashboardQuery.data])
  const aiConfig = useMemo(() => (configQuery.data ? fromApiAIConfigToDomain(configQuery.data) : null), [configQuery.data])

  const knowledgeBase = useMemo(() => {
    const versions = (docsQuery.data ?? []).map(fromApiDocumentVersionToDomain)
    return {
      total: versions.length,
      available: versions.filter((v) => v.processing === DOCUMENT_PROCESSING_STATUS.AUTORIZADO && v.active).length,
      pendingAuthorization: versions.filter((v) => v.processing === DOCUMENT_PROCESSING_STATUS.PENDIENTE_AUTORIZACION).length,
      processing: versions.filter((v) => v.processing === DOCUMENT_PROCESSING_STATUS.PROCESANDO).length,
      failed: versions.filter((v) => v.processing === DOCUMENT_PROCESSING_STATUS.ERROR).length,
      requiresReindex: versions.filter((v) => v.requiresReindex).length,
    }
  }, [docsQuery.data])

  return {
    dashboard,
    aiConfig,
    knowledgeBase,
    isLoading: dashboardQuery.isLoading,
    loadError: dashboardQuery.error ? toApiFailure(dashboardQuery.error).message : null,
    retryLoad: dashboardQuery.refetch,
  }
}
