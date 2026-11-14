import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useGetActiveMatrixQuery, usePublishMatrixMutation } from '@/app/api/adminApi'
import { runMutation, toApiFailure, type SubmitResult } from '@/lib/apiErrors'
import { fromApiMatrixToDomain, fromDomainMatrixToApi } from '@/mappers/admin.mapper'
import type { InitialMatrixFormValues } from '@/schemas/initialMatrix.schema'
import type { RiskLevelCode } from '@/types/domain.types'
import { MATRIX_SIZE, MATRIX_SUGGESTED_LEVEL_MIN_SCORE, RISK_LEVEL, RISK_LEVELS_ASCENDING } from '@/constants/domain.constants'
import { HTTP_STATUS } from '@/constants/api.constants'

export const LEVEL_CYCLE: readonly RiskLevelCode[] = RISK_LEVELS_ASCENDING
const cellKey = (probability: number, impact: number) => `${probability}-${impact}`
const SCALE = Array.from({ length: MATRIX_SIZE }, (_, i) => i + 1)

/** Nivel sugerido para la matriz inicial según el puntaje probabilidad × impacto. */
export const suggestedLevel = (probability: number, impact: number): RiskLevelCode => {
  const score = probability * impact
  return [...RISK_LEVELS_ASCENDING].reverse().find((level) => score >= MATRIX_SUGGESTED_LEVEL_MIN_SCORE[level]) ?? RISK_LEVEL.BAJO
}

const nextLevel = (current: RiskLevelCode) => LEVEL_CYCLE[(LEVEL_CYCLE.indexOf(current) + 1) % LEVEL_CYCLE.length]

/**
 * Caso de uso: matriz 5x5 vigente, edición en borrador y publicación como nueva CONFIGURACION_MATRIZ.
 * Si aún no existe ninguna matriz (semilla base, CHG-0039) expone el borrador de la matriz inicial.
 */
export function useMatrixConfigManager() {
  const { data, isLoading, error, refetch } = useGetActiveMatrixQuery()
  const [publish, { isLoading: isPublishing }] = usePublishMatrixMutation()
  // Solo se guardan las celdas modificadas; el resto se deriva de la matriz vigente.
  const [overrides, setOverrides] = useState<Record<string, RiskLevelCode>>({})
  // Borrador de la matriz inicial: celdas cambiadas respecto del nivel sugerido.
  const [initialOverrides, setInitialOverrides] = useState<Record<string, RiskLevelCode>>({})

  const matrix = useMemo(() => (data ? fromApiMatrixToDomain(data) : null), [data])
  const failure = error ? toApiFailure(error) : null
  const isMissing = failure?.status === HTTP_STATUS.NOT_FOUND

  const levelAt = useCallback(
    (probability: number, impact: number): RiskLevelCode | null => {
      const override = overrides[cellKey(probability, impact)]
      if (override) return override
      return matrix?.cells.find((c) => c.probability === probability && c.impact === impact)?.levelCode ?? null
    },
    [matrix, overrides],
  )

  const changedCells = useMemo(
    () =>
      Object.entries(overrides).filter(([key, level]) => {
        const [p, i] = key.split('-').map(Number)
        return matrix?.cells.find((c) => c.probability === p && c.impact === i)?.levelCode !== level
      }).length,
    [matrix, overrides],
  )

  const cycleCell = useCallback(
    (probability: number, impact: number) => {
      const current = levelAt(probability, impact) ?? RISK_LEVEL.BAJO
      setOverrides((prev) => ({ ...prev, [cellKey(probability, impact)]: nextLevel(current) }))
    },
    [levelAt],
  )

  const isCellChanged = useCallback(
    (probability: number, impact: number) => {
      const override = overrides[cellKey(probability, impact)]
      return override !== undefined && override !== matrix?.cells.find((c) => c.probability === probability && c.impact === impact)?.levelCode
    },
    [matrix, overrides],
  )

  const discard = useCallback(() => setOverrides({}), [])

  const publishDraft = useCallback(
    async (name: string): Promise<SubmitResult> => {
      if (!matrix) return undefined
      const cells = matrix.cells.map((c) => ({
        probability: c.probability,
        impact: c.impact,
        levelCode: levelAt(c.probability, c.impact) ?? c.levelCode,
      }))
      const { data: published, failure: publishFailure } = await runMutation(() => publish(fromDomainMatrixToApi({ name, cells })).unwrap())
      if (publishFailure) return publishFailure
      setOverrides({})
      toast.success(`Matriz ${published!.version} publicada`, {
        description: 'Las evaluaciones anteriores conservan la configuración con la que se hicieron.',
      })
      return undefined
    },
    [levelAt, matrix, publish],
  )

  // --- Matriz inicial (no existe ninguna configuración activa) -------------------------------
  const initialLevelAt = useCallback(
    (probability: number, impact: number): RiskLevelCode => initialOverrides[cellKey(probability, impact)] ?? suggestedLevel(probability, impact),
    [initialOverrides],
  )

  const cycleInitialCell = useCallback(
    (probability: number, impact: number) =>
      setInitialOverrides((prev) => ({ ...prev, [cellKey(probability, impact)]: nextLevel(prev[cellKey(probability, impact)] ?? suggestedLevel(probability, impact)) })),
    [],
  )

  const isInitialCellChanged = useCallback(
    (probability: number, impact: number) => {
      const override = initialOverrides[cellKey(probability, impact)]
      return override !== undefined && override !== suggestedLevel(probability, impact)
    },
    [initialOverrides],
  )

  const publishInitial = useCallback(
    async (values: InitialMatrixFormValues): Promise<SubmitResult> => {
      const cells = SCALE.flatMap((probability) => SCALE.map((impact) => ({ probability, impact, levelCode: initialLevelAt(probability, impact) })))
      const { data: published, failure: publishFailure } = await runMutation(() =>
        publish(fromDomainMatrixToApi({ name: values.name, probabilityCriteria: values.probabilityCriteria, impactCriteria: values.impactCriteria, cells })).unwrap(),
      )
      if (publishFailure) return publishFailure
      setInitialOverrides({})
      toast.success(`Matriz inicial ${published!.version} publicada`, { description: 'Los analistas ya pueden evaluar riesgos con esta matriz.' })
      return undefined
    },
    [initialLevelAt, publish],
  )

  return {
    matrix,
    isLoading,
    isMissing,
    loadError: failure && !isMissing ? failure.message : null,
    retryLoad: refetch,
    levelAt,
    cycleCell,
    isCellChanged,
    changedCells,
    isDirty: changedCells > 0,
    discard,
    publishDraft,
    isPublishing,
    initialLevelAt,
    cycleInitialCell,
    isInitialCellChanged,
    publishInitial,
  }
}
