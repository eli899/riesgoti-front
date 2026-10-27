import { z } from 'zod'
import { GUIDANCE_RESULT } from '@/constants/domain.constants'
import { FIELD_LIMITS as L, FILE_LIMITS, VALIDATION_MESSAGES } from '@/constants/validation.constants'

const M = VALIDATION_MESSAGES.INCIDENT

const hasAllowedExtension = (file: File) => FILE_LIMITS.EVIDENCE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))

/** Contrato de creación de INCIDENCIA + EVIDENCIA_INCIDENCIA (espejo de IncidentCreateInputSerializer). */
export const incidentFormSchema = z
  .object({
    titulo: z.string().trim().min(L.INCIDENT_TITLE_MIN, M.TITLE_MIN).max(L.INCIDENT_TITLE_MAX),
    descripcion: z.string().trim().min(L.INCIDENT_DESCRIPTION_MIN, M.DESCRIPTION_MIN),
    activo_reportado_id: z.number().int().positive().nullable().optional(),
    activo_texto: z.string().max(L.INCIDENT_ASSET_TEXT_MAX).optional(),
    evidencias: z
      .array(z.custom<File>((file) => file instanceof File, M.FILE_INVALID))
      .max(FILE_LIMITS.EVIDENCES_PER_INCIDENT_MAX, M.EVIDENCES_MAX)
      .refine((files) => files.every(hasAllowedExtension), M.EVIDENCE_FORMAT)
      .refine((files) => files.every((f) => f.size <= FILE_LIMITS.EVIDENCE_MAX_BYTES), M.EVIDENCE_SIZE)
      .optional(),
  })
  .refine(
    (data) => Boolean(data.activo_reportado_id) || Boolean(data.activo_texto && data.activo_texto.trim().length >= L.INCIDENT_ASSET_TEXT_MIN),
    {
      message: M.ASSET_REQUIRED,
      path: ['activo_reportado_id'],
    },
  )

export type IncidentFormValues = z.infer<typeof incidentFormSchema>

/** Respuesta del reportante a la orientación operativa (RESPUESTA_ORIENTACION). */
export const orientationFeedbackSchema = z.object({
  resultado: z.nativeEnum(GUIDANCE_RESULT),
})

export type OrientationFeedbackValues = z.infer<typeof orientationFeedbackSchema>

/** Formulario de atención humana N2 (ATENCION_INCIDENCIA). */
export const humanAttentionSchema = z
  .object({
    acciones: z.string().max(L.ATTENTION_TEXT_MAX).optional(),
    nota_resolucion: z.string().max(L.ATTENTION_TEXT_MAX).optional(),
    cerrar: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.cerrar) return
    if (!data.acciones || data.acciones.trim().length < L.ATTENTION_TEXT_MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.ATTENTION.ACTIONS_MIN,
        path: ['acciones'],
      })
    }
    if (!data.nota_resolucion || data.nota_resolucion.trim().length < L.ATTENTION_TEXT_MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.ATTENTION.RESOLUTION_MIN,
        path: ['nota_resolucion'],
      })
    }
  })

export type HumanAttentionFormValues = z.infer<typeof humanAttentionSchema>
