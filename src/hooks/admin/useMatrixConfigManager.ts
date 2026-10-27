import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useGetActiveMatrixQuery, usePublishMatrixMutation } from '@/app/api/adminApi'
import { runMutation, toApiFailure, type SubmitResult } from '@/lib/apiErrors'
import { fromApiMatrixToDomain, fromDomainMatrixToApi } from '@/mappers/admin.mapper'
import type { RiskLevelCode } from '@/types/domain.types'
import { RISK_LEVEL, RISK_LEVELS_ASCENDING } from '@/constants/domain.constants'

export const LEVEL_CYCLE: readonly RiskLevelCode[] = RISK_LEVELS_ASCENDING
const cellKey = (probability: number, impact: number) => `${probability}-${impact}`

/** Caso de uso: matriz 5x5 vigente, edición en borrador y publicación como nueva CONFIGURACION_MATRIZ. */
export function useMatrixConfigManager() {
  const { data, isLoading, error, refetch } = useGetActiveMatrixQuery()
  const [publish, { isLoading: isPublishing }] = usePublishMatrixMutation()
  // Solo se guardan las celdas modificadas; el resto se deriva de la matriz vigente.
  const [overrides, setOverrides] = useState<Record<string, RiskLevelCode>>({})

  const matrix = useMemo(() => (data ? fromApiMatrixToDomain(data) : null), [data])

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
      const next = LEVEL_CYCLE[(LEVEL_CYCLE.indexOf(current) + 1) % LEVEL_CYCLE.length]
      setOverrides((prev) => ({ ...prev, [cellKey(probability, impact)]: next }))
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
      const { data: published, failure } = await runMutation(() => publish(fromDomainMatrixToApi({ name, cells })).unwrap())
      if (failure) return failure
      setOverrides({})
      toast.success(`Matriz ${published!.version} publicada`, {
        description: 'Las evaluaciones anteriores conservan la configuración con la que se hicieron.',
      })
      return undefined
    },
    [levelAt, matrix, publish],
  )

  return {
    matrix,
    isLoading,
    loadError: error ? toApiFailure(error).message : null,
    retryLoad: refetch,
    levelAt,
    cycleCell,
    isCellChanged,
    changedCells,
    isDirty: changedCells > 0,
    discard,
    publishDraft,
    isPublishing,
  }
}
