import { z } from 'zod'
import { MATRIX_SIZE } from '@/constants/domain.constants'
import { FIELD_LIMITS as L, VALIDATION_MESSAGES } from '@/constants/validation.constants'

const M = VALIDATION_MESSAGES.MATRIX

const criterionSchema = z.object({
  value: z.number().int(),
  name: z.string().trim().min(L.MATRIX_CRITERION_NAME_MIN, M.CRITERION_NAME_MIN).max(L.MATRIX_CRITERION_NAME_MAX, M.CRITERION_NAME_MAX),
  description: z.string().optional(),
})

/**
 * Configuración inicial de la matriz 5x5 cuando no existe ninguna activa (CHG-0039). Espejo de
 * PublishMatrixInputSerializer con criterios explícitos: exactamente los valores 1..5 en probabilidad e impacto.
 */
export const initialMatrixSchema = z.object({
  name: z.string().trim().min(L.MATRIX_NAME_MIN, M.NAME_MIN).max(L.MATRIX_NAME_MAX, M.NAME_MAX),
  probabilityCriteria: z.array(criterionSchema).length(MATRIX_SIZE),
  impactCriteria: z.array(criterionSchema).length(MATRIX_SIZE),
})

export type InitialMatrixFormValues = z.infer<typeof initialMatrixSchema>
