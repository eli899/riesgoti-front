import { useDeleteRiskVersionMutation } from '@/app/api/risksApi'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useConfirmedDeletion } from '@/hooks/useConfirmedDeletion'
import type { RiskVersion } from '@/types/domain.types'
import { RISK_VALIDATION_STATUS } from '@/constants/domain.constants'
import { PERMISSIONS } from '@/constants/rbac.constants'

/**
 * Caso de uso: eliminación física de una propuesta de riesgo pendiente (riesgo.eliminar). Solo versiones sin evaluación
 * ni decisión; las incidencias vinculadas y sus análisis se conservan.
 */
export function useRiskVersionDeletion(version: RiskVersion | null) {
  const { hasPermission } = useAuthSession()
  const [deleteVersion] = useDeleteRiskVersionMutation()
  const deletion = useConfirmedDeletion((target: RiskVersion) => deleteVersion(target.id).unwrap(), {
    fallback: 'No se pudo eliminar la propuesta.',
    successMessage: (target) => `Propuesta ${target.riskCode} v${target.number} eliminada`,
  })
  const canDelete =
    version !== null &&
    hasPermission(PERMISSIONS.RISK_DELETE) &&
    version.status === RISK_VALIDATION_STATUS.PENDIENTE &&
    version.evaluation === null

  return { canDelete, deletion }
}
