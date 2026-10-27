import { z } from 'zod'
import { FIELD_LIMITS as L, VALIDATION_MESSAGES } from '@/constants/validation.constants'

const M = VALIDATION_MESSAGES.ASSET

/** Contrato de ACTIVO (espejo de ActivoInputSerializer). criticidad 1..4 = BAJO..CRITICO. */
export const assetFormSchema = z.object({
  tipo_id: z.number({ required_error: M.TYPE_REQUIRED, invalid_type_error: M.TYPE_REQUIRED }).int().positive(M.TYPE_REQUIRED),
  codigo: z.string().trim().min(L.ASSET_CODE_MIN, M.CODE_REQUIRED).max(L.ASSET_CODE_MAX, M.CODE_MAX),
  nombre: z.string().trim().min(L.ASSET_NAME_MIN, M.NAME_MIN).max(L.ASSET_NAME_MAX, M.NAME_MAX),
  descripcion: z.string().optional(),
  criticidad: z.number().int().min(L.ASSET_CRITICALITY_MIN).max(L.ASSET_CRITICALITY_MAX).nullable(),
  activo: z.boolean(),
})

export type AssetFormValues = z.infer<typeof assetFormSchema>
