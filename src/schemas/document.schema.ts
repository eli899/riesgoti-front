import { z } from 'zod'

export const MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024 // 25 MB

/** Contrato de carga de VERSION_DOCUMENTO (espejo de DocumentUploadInputSerializer). */
export const documentUploadSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(2, 'El código del documento es obligatorio (ej. POL-SGSI-01)')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, 'Use letras, dígitos, punto, guion o guion bajo (ej. POL-SGSI-01)'),
  titulo: z.string().trim().min(5, 'El título debe tener al menos 5 caracteres').max(255),
  descripcion: z.string().optional(),
  version: z.string().trim().min(1, 'La versión es obligatoria (ej. v1.0)').max(50),
  finalidad: z.enum(['OPERATIVA', 'ESTRATEGICA', 'AMBAS']),
  archivo: z
    .custom<File>((file) => file instanceof File, 'Debe seleccionar un archivo PDF')
    .refine((file) => file?.type === 'application/pdf' || file?.name.toLowerCase().endsWith('.pdf'), 'Solo se permiten archivos .pdf')
    .refine((file) => file?.size <= MAX_PDF_SIZE_BYTES, 'El archivo PDF no debe superar 25 MB'),
})

export type DocumentUploadFormValues = z.infer<typeof documentUploadSchema>
