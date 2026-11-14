import { z } from 'zod'
import { FIELD_LIMITS as L, VALIDATION_MESSAGES } from '@/constants/validation.constants'

const M = VALIDATION_MESSAGES.ASSET_TYPE

/** Contrato de TIPO_ACTIVO (espejo de TipoActivoInputSerializer). CHG-0039. */
export const assetTypeFormSchema = z.object({
  nombre: z.string().trim().min(L.ASSET_TYPE_NAME_MIN, M.NAME_MIN).max(L.ASSET_TYPE_NAME_MAX, M.NAME_MAX),
})

export type AssetTypeFormValues = z.infer<typeof assetTypeFormSchema>
