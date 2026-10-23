import { z } from 'zod'

const MIN_JUSTIFICATION = 15
const MIN_OBSERVATION = 10

/** Retiro de un falso positivo de la agrupación (VERSION_INCIDENCIA.estado = RETIRADA). */
export const removeIncidentFromGroupSchema = z.object({
  motivo_retiro: z
    .string()
    .trim()
    .min(MIN_OBSERVATION, 'Explique el motivo por el cual retira este falso positivo (mínimo 10 caracteres)'),
})

export type RemoveIncidentFromGroupValues = z.infer<typeof removeIncidentFromGroupSchema>

/** Confirmación del activo afectado y de la agrupación (POST /risk-versions/{id}/confirm-grouping/). */
export const confirmGroupingSchema = z.object({
  activo_confirmado_id: z.number({ required_error: 'Seleccione el activo afectado' }).int().positive('Seleccione el activo afectado'),
  justificacion_cambio_activo: z.string().max(2000).optional(),
})

export type ConfirmGroupingValues = z.infer<typeof confirmGroupingSchema>

/**
 * Variante del formulario: si el activo elegido no es ninguno de los reportados en las incidencias incluidas, exige
 * justificar el cambio (espejo de RiskGovernanceDecisionService.confirm_grouping).
 */
export const confirmGroupingFormSchema = (reportedAssetIds: readonly number[]) =>
  confirmGroupingSchema.superRefine((data, ctx) => {
    const changed = reportedAssetIds.length > 0 && !reportedAssetIds.includes(data.activo_confirmado_id)
    if (changed && (data.justificacion_cambio_activo ?? '').trim().length < MIN_OBSERVATION) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['justificacion_cambio_activo'],
        message: 'El activo elegido difiere del reportado en las incidencias: justifique el cambio (mínimo 10 caracteres)',
      })
    }
  })

/** Evaluación en la matriz 5x5 activa (EVALUACION_RIESGO, espejo de RiskEvaluateInputSerializer). */
export const riskEvaluateSchema = z.object({
  probabilidad: z.number({ required_error: 'Seleccione un nivel de probabilidad (1 a 5)' }).int().min(1).max(5),
  impacto: z.number({ required_error: 'Seleccione un nivel de impacto (1 a 5)' }).int().min(1).max(5),
  justificacion: z
    .string()
    .trim()
    .min(MIN_JUSTIFICATION, 'La justificación de evaluación en matriz debe tener al menos 15 caracteres'),
})

export type RiskEvaluateValues = z.infer<typeof riskEvaluateSchema>

/**
 * Decisión ISO/IEC 27005 (DECISION_RIESGO). Los campos de activo, agrupación y evaluación se precargan desde la
 * VERSION_RIESGO vigente y se validan aquí como precondiciones; el payload enviado lo arma `fromDomainRiskDecisionToApi`.
 */
export const riskDecisionSchema = z
  .object({
    accion: z.enum(['VALIDADA', 'CORREGIDA', 'RECHAZADA']),
    activo_confirmado_id: z.number().int().positive().nullable().optional(),
    agrupacion_confirmada: z.boolean(),
    probabilidad: z.number().int().min(1).max(5).nullable().optional(),
    impacto: z.number().int().min(1).max(5).nullable().optional(),
    justificacion: z.string().optional(),
    tiene_citas_estrategicas: z.boolean(),
    justificacion_sin_fuentes: z.string().optional(),
    observacion: z.string().optional(),
    // Campos editables cuando accion === 'CORREGIDA'
    titulo_corregido: z.string().max(255).optional(),
    descripcion_corregida: z.string().optional(),
    amenaza_corregida: z.string().optional(),
    vulnerabilidad_corregida: z.string().optional(),
    consecuencia_corregida: z.string().optional(),
    recomendacion_corregida: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: [path] })
    const tooShort = (value: string | undefined, min: number) => !value || value.trim().length < min

    if (data.accion === 'VALIDADA') {
      if (!data.activo_confirmado_id) issue('activo_confirmado_id', 'Debe confirmar el activo afectado antes de validar el riesgo')
      if (!data.agrupacion_confirmada) issue('agrupacion_confirmada', 'Debe confirmar la revisión de la agrupación de incidencias')
      if (!data.probabilidad) issue('probabilidad', 'Seleccione un nivel de probabilidad (1 a 5) en la matriz')
      if (!data.impacto) issue('impacto', 'Seleccione un nivel de impacto (1 a 5) en la matriz')
      if (tooShort(data.justificacion, MIN_JUSTIFICATION)) {
        issue('justificacion', 'La justificación de evaluación en matriz debe tener al menos 15 caracteres')
      }
      if (!data.tiene_citas_estrategicas && tooShort(data.justificacion_sin_fuentes, MIN_JUSTIFICATION)) {
        issue('justificacion_sin_fuentes', 'Al no existir fuentes documentales estratégicas citadas, debe justificar la validación sin fuentes (mínimo 15 caracteres)')
      }
      if (tooShort(data.observacion, MIN_OBSERVATION)) {
        issue('observacion', 'Registre una observación de la validación (mínimo 10 caracteres)')
      }
    }

    if (data.accion === 'CORREGIDA') {
      if (tooShort(data.observacion, MIN_OBSERVATION)) {
        issue('observacion', 'Para corregir la propuesta debe registrar una observación (mínimo 10 caracteres)')
      }
      const corrected = [
        data.titulo_corregido, data.descripcion_corregida, data.amenaza_corregida,
        data.vulnerabilidad_corregida, data.consecuencia_corregida, data.recomendacion_corregida,
      ]
      if (!corrected.some((value) => value && value.trim())) {
        issue('titulo_corregido', 'Indique al menos un campo corregido para la nueva versión')
      }
    }

    if (data.accion === 'RECHAZADA' && tooShort(data.observacion, MIN_OBSERVATION)) {
      issue('observacion', 'Debe registrar el motivo del rechazo de la propuesta (mínimo 10 caracteres)')
    }
  })

export type RiskDecisionFormValues = z.infer<typeof riskDecisionSchema>

export const CORRECTABLE_FIELDS = [
  'titulo_corregido', 'descripcion_corregida', 'amenaza_corregida',
  'vulnerabilidad_corregida', 'consecuencia_corregida', 'recomendacion_corregida',
] as const

export type CorrectableField = (typeof CORRECTABLE_FIELDS)[number]

/**
 * Variante del diálogo de decisión: los campos corregidos se precargan con el contenido vigente, por lo que una
 * corrección exige que al menos uno difiera del original (la versión n+1 debe aportar cambios).
 */
export const riskDecisionFormSchema = (original: Record<CorrectableField, string>) =>
  riskDecisionSchema.superRefine((data, ctx) => {
    if (data.accion !== 'CORREGIDA') return
    const changed = CORRECTABLE_FIELDS.some((f) => (data[f] ?? '').trim() !== original[f].trim())
    if (!changed) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['titulo_corregido'], message: 'Modifique al menos un campo del contenido para crear la nueva versión' })
    }
  })
