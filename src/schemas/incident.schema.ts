import { z } from 'zod'

export const MAX_EVIDENCES_PER_INCIDENT = 5
export const MAX_EVIDENCE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
export const EVIDENCE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.pdf', '.log', '.txt'] as const

const hasAllowedExtension = (file: File) => EVIDENCE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))

/** Contrato de creación de INCIDENCIA + EVIDENCIA_INCIDENCIA (espejo de IncidentCreateInputSerializer). */
export const incidentFormSchema = z
  .object({
    titulo: z.string().trim().min(5, 'El título debe describir brevemente el problema (mínimo 5 caracteres)').max(255),
    descripcion: z.string().trim().min(20, 'Describa qué ocurrió con al menos 20 caracteres'),
    activo_reportado_id: z.number().int().positive().nullable().optional(),
    activo_texto: z.string().max(255).optional(),
    evidencias: z
      .array(z.custom<File>((file) => file instanceof File, 'Archivo inválido'))
      .max(MAX_EVIDENCES_PER_INCIDENT, `Máximo ${MAX_EVIDENCES_PER_INCIDENT} evidencias por incidencia`)
      .refine((files) => files.every(hasAllowedExtension), 'Formatos permitidos: png, jpg, pdf, log, txt')
      .refine((files) => files.every((f) => f.size <= MAX_EVIDENCE_SIZE_BYTES), 'Cada evidencia debe pesar como máximo 10 MB')
      .optional(),
  })
  .refine(
    (data) => Boolean(data.activo_reportado_id) || Boolean(data.activo_texto && data.activo_texto.trim().length >= 2),
    {
      message: 'Seleccione un activo del catálogo o especifique el recurso afectado en texto libre',
      path: ['activo_reportado_id'],
    },
  )

export type IncidentFormValues = z.infer<typeof incidentFormSchema>

/** Respuesta del reportante a la orientación operativa (RESPUESTA_ORIENTACION). */
export const orientationFeedbackSchema = z.object({
  resultado: z.enum(['FUNCIONO', 'NO_FUNCIONO']),
})

export type OrientationFeedbackValues = z.infer<typeof orientationFeedbackSchema>

/** Formulario de atención humana N2 (ATENCION_INCIDENCIA). */
export const humanAttentionSchema = z
  .object({
    acciones: z.string().max(10000).optional(),
    nota_resolucion: z.string().max(10000).optional(),
    cerrar: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.cerrar) return
    if (!data.acciones || data.acciones.trim().length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Para cerrar el caso debe detallar las acciones realizadas (mínimo 10 caracteres)',
        path: ['acciones'],
      })
    }
    if (!data.nota_resolucion || data.nota_resolucion.trim().length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Para cerrar el caso debe registrar la nota de resolución (mínimo 10 caracteres)',
        path: ['nota_resolucion'],
      })
    }
  })

export type HumanAttentionFormValues = z.infer<typeof humanAttentionSchema>
