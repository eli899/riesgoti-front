import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { useGetActiveMatrixQuery } from '@/app/api/adminApi'
import { useEvaluateRiskVersionMutation, useGetRiskVersionQuery } from '@/app/api/risksApi'
import { useAuthSession } from '@/hooks/useAuthSession'
import { runMutation, toApiFailure, type SubmitResult } from '@/lib/apiErrors'
import { RISK_LEVEL_LABEL } from '@/constants/labels.constants'
import { fromApiMatrixToDomain } from '@/mappers/admin.mapper'
import { fromApiRiskVersionToDomain, fromDomainRiskEvaluateToApi } from '@/mappers/risks.mapper'
import type { RiskEvaluateValues } from '@/schemas/riskEvaluation.schema'
import type { RiskLevelCode } from '@/types/domain.types'
import { RISK_VALIDATION_STATUS } from '@/constants/domain.constants'

/**
 * Caso de uso: evaluación de la VERSION_RIESGO en la CONFIGURACION_MATRIZ activa (EVALUACION_RIESGO). El backend
 * fija el celda_id de la matriz vigente; una matriz publicada después no altera la evaluación guardada (INV-04).
 * Solo el ANALISTA con riesgo.evaluar puede guardar (INV-05).
 */
export function useRiskMatrixEvaluation(versionId: number | null) {
  const { canEvaluateRisks } = useAuthSession()
  const skip = versionId === null

  const versionQuery = useGetRiskVersionQuery(versionId ?? 0, { skip })
  const version = useMemo(() => (versionQuery.data ? fromApiRiskVersionToDomain(versionQuery.data) : null), [versionQuery.data])

  const matrixQuery = useGetActiveMatrixQuery()
  const matrix = useMemo(() => (matrixQuery.data ? fromApiMatrixToDomain(matrixQuery.data) : null), [matrixQuery.data])

  const levels = useMemo(() => new Map(matrix?.cells.map((c) => [`${c.probability}-${c.impact}`, c.levelCode]) ?? []), [matrix])
  const levelAt = useCallback((probability: number, impact: number): RiskLevelCode | null => levels.get(`${probability}-${impact}`) ?? null, [levels])

  const [evaluateRequest, { isLoading: isSaving }] = useEvaluateRiskVersionMutation()

  const evaluate = useCallback(
    async (values: RiskEvaluateValues): Promise<SubmitResult> => {
      if (versionId === null) return undefined
      const { data, failure } = await runMutation(() => evaluateRequest({ id: versionId, body: fromDomainRiskEvaluateToApi(values) }).unwrap())
      if (failure) return failure
      toast.success('Evaluación guardada', {
        description: data ? `P${data.probabilidad} × I${data.impacto} = ${RISK_LEVEL_LABEL[data.nivel_codigo]} · Matriz ${data.matriz_version}` : undefined,
      })
      return undefined
    },
    [evaluateRequest, versionId],
  )

  const evaluation = version?.evaluation ?? null
  return {
    matrix,
    levelAt,
    evaluation,
    /** La evaluación guardada pertenece a una matriz anterior a la activa (se conserva su celda histórica). */
    evaluatedWithPreviousMatrix: Boolean(evaluation && matrix && evaluation.matrix.id !== matrix.id),
    canEvaluate: canEvaluateRisks && version?.status === RISK_VALIDATION_STATUS.PENDIENTE,
    evaluate,
    isSaving,
    isLoading: matrixQuery.isLoading,
    loadError: matrixQuery.error ? toApiFailure(matrixQuery.error).message : null,
    retryLoad: () => matrixQuery.refetch(),
  }
}
