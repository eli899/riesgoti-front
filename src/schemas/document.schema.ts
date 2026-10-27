import { z } from 'zod'
import { DOCUMENT_PURPOSE } from '@/constants/domain.constants'
import { FIELD_LIMITS as L, FILE_LIMITS, VALIDATION_MESSAGES } from '@/constants/validation.constants'

const M = VALIDATION_MESSAGES.DOCUMENT

/** Contrato de carga de VERSION_DOCUMENTO (espejo de DocumentUploadInputSerializer). */
export const documentUploadSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(L.DOCUMENT_CODE_MIN, M.CODE_REQUIRED)
    .max(L.DOCUMENT_CODE_MAX, M.CODE_MAX)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, M.CODE_FORMAT),
  titulo: z.string().trim().min(L.DOCUMENT_TITLE_MIN, M.TITLE_MIN).max(L.DOCUMENT_TITLE_MAX),
  descripcion: z.string().optional(),
  version: z.string().trim().min(L.DOCUMENT_VERSION_MIN, M.VERSION_REQUIRED).max(L.DOCUMENT_VERSION_MAX),
  finalidad: z.nativeEnum(DOCUMENT_PURPOSE),
  archivo: z
    .custom<File>((file) => file instanceof File, M.FILE_REQUIRED)
    .refine((file) => file?.type === FILE_LIMITS.PDF_MIME_TYPE || file?.name.toLowerCase().endsWith(FILE_LIMITS.PDF_EXTENSION), M.FILE_TYPE)
    .refine((file) => file?.size <= FILE_LIMITS.PDF_MAX_BYTES, M.FILE_SIZE),
})

export type DocumentUploadFormValues = z.infer<typeof documentUploadSchema>
