import { z } from 'zod'

/** Contrato de ACTIVO (espejo de ActivoInputSerializer). criticidad 1..4 = BAJO..CRITICO. */
export const assetFormSchema = z.object({
  tipo_id: z.number({ required_error: 'Seleccione el tipo de activo', invalid_type_error: 'Seleccione el tipo de activo' }).int().positive('Seleccione el tipo de activo'),
  codigo: z.string().trim().min(2, 'Ingrese un código (ej. ACT-007)').max(50, 'Máximo 50 caracteres'),
  nombre: z.string().trim().min(3, 'Ingrese un nombre de al menos 3 caracteres').max(150, 'Máximo 150 caracteres'),
  descripcion: z.string().optional(),
  criticidad: z.number().int().min(1).max(4).nullable(),
  activo: z.boolean(),
})

export type AssetFormValues = z.infer<typeof assetFormSchema>
