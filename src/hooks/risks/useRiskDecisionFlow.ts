import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { useGetRiskVersionQuery, useSubmitRiskDecisionMutation } from '@/app/api/risksApi'
import { useAuthSession } from '@/hooks/useAuthSession'
import { runMutation, type SubmitResult } from '@/lib/apiErrors'
import {
  fromApiRiskVersionToDomain,
  fromDomainRiskDecisionToApi,
  fromDomainRiskVersionToCorrectionDefaults,
  fromDomainRiskVersionToDecisionDefaults,
} from '@/mappers/risks.mapper'
import type { RiskDecisionFormValues } from '@/schemas/riskEvaluation.schema'
import { RISK_DECISION_ACTION, RISK_VALIDATION_STATUS } from '@/constants/domain.constants'
import { PERMISSIONS, ROLES } from '@/constants/rbac.constants'

const SUCCESS: Record<RiskDecisionFormValues['accion'], [string, string]> = {
  VALIDADA: ['Riesgo validado', 'La versión pasa a ser la vigente del riesgo. Validar no ejecuta controles ni cierra incidencias.'],
  CORREGIDA: ['Corrección registrada', 'Se creó una nueva versión del analista que debe evaluarse y validarse.'],
  RECHAZADA: ['Propuesta rechazada', 'La versión queda rechazada y se conserva en el historial.'],
}

/**
 * Caso de uso: decisión ISO/IEC 27005 sobre una VERSION_RIESGO pendiente (DECISION_RIESGO). VALIDADA exige activo,
 * agrupación y evaluación previos; CORREGIDA crea la versión n+1 (origen ANALISTA) y `onCorrected` recibe su id.
 * Solo el ANALISTA con riesgo.validar decide (INV-05: el ADMIN recibe 403).
 */
export function useRiskDecisionFlow(versionId: number | null, onCorrected?: (newVersionId: number) => void) {
  const { roleCode, hasPermission } = useAuthSession()
  const versionQuery = useGetRiskVersionQuery(versionId ?? 0, { skip: versionId === null })
  const version = useMemo(() => (versionQuery.data ? fromApiRiskVersionToDomain(versionQuery.data) : null), [versionQuery.data])
  const [submitDecision, { isLoading: isSubmitting }] = useSubmitRiskDecisionMutation()

  const canDecide = roleCode !== ROLES.ADMIN && hasPermission(PERMISSIONS.RISK_VALIDATE) && version?.status === RISK_VALIDATION_STATUS.PENDIENTE

  /** Precondiciones de VALIDADA (espejo de RiskGovernanceDecisionService._validate_validation_preconditions). */
  const validationBlockers = useMemo(() => {
    if (!version) return []
    return [
      !version.confirmedAsset && 'Confirma el activo afectado.',
      !version.grouping.confirmed && 'Confirma la agrupación de incidencias.',
      !version.evaluation && 'Guarda la evaluación en la matriz 5×5 con su justificación.',
    ].filter((b): b is string => Boolean(b))
  }, [version])

  const defaults = useMemo(() => (version ? fromDomainRiskVersionToDecisionDefaults(version) : null), [version])
  const correctionDefaults = useMemo(() => (version ? fromDomainRiskVersionToCorrectionDefaults(version) : null), [version])

  const decide = useCallback(
    async (values: RiskDecisionFormValues): Promise<SubmitResult> => {
      if (versionId === null) return undefined
      const body = fromDomainRiskDecisionToApi(values, correctionDefaults ?? undefined)
      const { data, failure } = await runMutation(() => submitDecision({ id: versionId, body }).unwrap())
      if (failure) return failure
      const [title, description] = SUCCESS[values.accion]
      toast.success(values.accion === RISK_DECISION_ACTION.CORREGIDA && data ? `${title}: ${data.riesgo_codigo} v${data.numero}` : title, { description })
      if (values.accion === RISK_DECISION_ACTION.CORREGIDA && data && data.id !== versionId) onCorrected?.(data.id)
      return undefined
    },
    [correctionDefaults, onCorrected, submitDecision, versionId],
  )

  return { version, canDecide, validationBlockers, defaults, correctionDefaults, decide, isSubmitting }
}
