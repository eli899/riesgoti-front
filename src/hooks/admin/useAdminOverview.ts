import { useMemo } from 'react'
import { useGetActiveAIConfigQuery, useGetActiveMatrixQuery, useGetAssetsQuery, useGetAssetTypesQuery, useGetDocumentVersionsQuery } from '@/app/api/adminApi'
import { useGetRiskDashboardQuery } from '@/app/api/risksApi'
import { toApiFailure } from '@/lib/apiErrors'
import { fromApiAIConfigToDomain, fromApiDocumentVersionToDomain } from '@/mappers/admin.mapper'
import { fromApiRiskDashboardToDomain } from '@/mappers/risks.mapper'
import { DOCUMENT_PROCESSING_STATUS } from '@/constants/domain.constants'
import { HTTP_STATUS } from '@/constants/api.constants'

const isNotFound = (error: unknown) => Boolean(error) && toApiFailure(error).status === HTTP_STATUS.NOT_FOUND

/** Caso de uso: panorama del administrador (indicadores agregados + estado de la base de conocimiento e IA). */
export function useAdminOverview() {
  const dashboardQuery = useGetRiskDashboardQuery()
  const docsQuery = useGetDocumentVersionsQuery()
  const configQuery = useGetActiveAIConfigQuery()
  const matrixQuery = useGetActiveMatrixQuery()
  const typesQuery = useGetAssetTypesQuery()
  const assetsQuery = useGetAssetsQuery()

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

  // Puesta en marcha tras la semilla base (CHG-0039). null mientras alguna consulta siga cargando.
  const setupLoading = configQuery.isLoading || matrixQuery.isLoading || typesQuery.isLoading || assetsQuery.isLoading || docsQuery.isLoading
  const setup = setupLoading
    ? null
    : {
        assetTypes: (typesQuery.data ?? []).some((t) => t.activo),
        assets: (assetsQuery.data ?? []).length > 0,
        matrix: Boolean(matrixQuery.data) && !isNotFound(matrixQuery.error),
        aiConfig: Boolean(configQuery.data) && !isNotFound(configQuery.error),
        documents: knowledgeBase.available > 0,
      }

  return {
    dashboard,
    setup,
    aiConfig,
    knowledgeBase,
    isLoading: dashboardQuery.isLoading,
    loadError: dashboardQuery.error ? toApiFailure(dashboardQuery.error).message : null,
    retryLoad: dashboardQuery.refetch,
  }
}
