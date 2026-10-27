import { z } from 'zod'
import { RISK_DECISION_ACTION } from '@/constants/domain.constants'
import { RISK_MATRIX } from '@/constants/ui.constants'
import { FIELD_LIMITS as L, VALIDATION_MESSAGES } from '@/constants/validation.constants'

const M = VALIDATION_MESSAGES.RISK
const MIN_JUSTIFICATION = L.RISK_JUSTIFICATION_MIN
const MIN_OBSERVATION = L.RISK_OBSERVATION_MIN

/** Retiro de un falso positivo de la agrupación (VERSION_INCIDENCIA.estado = RETIRADA). */
export const removeIncidentFromGroupSchema = z.object({
  motivo_retiro: z
    .string()
    .trim()
    .min(MIN_OBSERVATION, M.REMOVAL_REASON_MIN),
})

export type RemoveIncidentFromGroupValues = z.infer<typeof removeIncidentFromGroupSchema>

/** Confirmación del activo afectado y de la agrupación (POST /risk-versions/{id}/confirm-grouping/). */
export const confirmGroupingSchema = z.object({
  activo_confirmado_id: z.number({ required_error: M.ASSET_REQUIRED }).int().positive(M.ASSET_REQUIRED),
  justificacion_cambio_activo: z.string().max(L.RISK_ASSET_CHANGE_JUSTIFICATION_MAX).optional(),
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
        message: M.ASSET_CHANGE_JUSTIFICATION_MIN,
      })
    }
  })

/** Evaluación en la matriz 5x5 activa (EVALUACION_RIESGO, espejo de RiskEvaluateInputSerializer). */
export const riskEvaluateSchema = z.object({
  probabilidad: z.number({ required_error: M.PROBABILITY_REQUIRED }).int().min(RISK_MATRIX.MIN_LEVEL).max(RISK_MATRIX.MAX_LEVEL),
  impacto: z.number({ required_error: M.IMPACT_REQUIRED }).int().min(RISK_MATRIX.MIN_LEVEL).max(RISK_MATRIX.MAX_LEVEL),
  justificacion: z
    .string()
    .trim()
    .min(MIN_JUSTIFICATION, M.JUSTIFICATION_MIN),
})

export type RiskEvaluateValues = z.infer<typeof riskEvaluateSchema>

/**
 * Decisión ISO/IEC 27005 (DECISION_RIESGO). Los campos de activo, agrupación y evaluación se precargan desde la
 * VERSION_RIESGO vigente y se validan aquí como precondiciones; el payload enviado lo arma `fromDomainRiskDecisionToApi`.
 */
export const riskDecisionSchema = z
  .object({
    accion: z.nativeEnum(RISK_DECISION_ACTION),
    activo_confirmado_id: z.number().int().positive().nullable().optional(),
    agrupacion_confirmada: z.boolean(),
    probabilidad: z.number().int().min(RISK_MATRIX.MIN_LEVEL).max(RISK_MATRIX.MAX_LEVEL).nullable().optional(),
    impacto: z.number().int().min(RISK_MATRIX.MIN_LEVEL).max(RISK_MATRIX.MAX_LEVEL).nullable().optional(),
    justificacion: z.string().optional(),
    tiene_citas_estrategicas: z.boolean(),
    justificacion_sin_fuentes: z.string().optional(),
    observacion: z.string().optional(),
    // Campos editables cuando accion === RISK_DECISION_ACTION.CORREGIDA
    titulo_corregido: z.string().max(L.RISK_TITLE_MAX).optional(),
    descripcion_corregida: z.string().optional(),
    amenaza_corregida: z.string().optional(),
    vulnerabilidad_corregida: z.string().optional(),
    consecuencia_corregida: z.string().optional(),
    recomendacion_corregida: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: [path] })
    const tooShort = (value: string | undefined, min: number) => !value || value.trim().length < min

    if (data.accion === RISK_DECISION_ACTION.VALIDADA) {
      if (!data.activo_confirmado_id) issue('activo_confirmado_id', M.DECISION_ASSET_REQUIRED)
      if (!data.agrupacion_confirmada) issue('agrupacion_confirmada', M.DECISION_GROUPING_REQUIRED)
      if (!data.probabilidad) issue('probabilidad', M.DECISION_PROBABILITY_REQUIRED)
      if (!data.impacto) issue('impacto', M.DECISION_IMPACT_REQUIRED)
      if (tooShort(data.justificacion, MIN_JUSTIFICATION)) {
        issue('justificacion', M.JUSTIFICATION_MIN)
      }
      if (!data.tiene_citas_estrategicas && tooShort(data.justificacion_sin_fuentes, MIN_JUSTIFICATION)) {
        issue('justificacion_sin_fuentes', M.NO_SOURCES_JUSTIFICATION_MIN)
      }
      if (tooShort(data.observacion, MIN_OBSERVATION)) {
        issue('observacion', M.VALIDATION_OBSERVATION_MIN)
      }
    }

    if (data.accion === RISK_DECISION_ACTION.CORREGIDA) {
      if (tooShort(data.observacion, MIN_OBSERVATION)) {
        issue('observacion', M.CORRECTION_OBSERVATION_MIN)
      }
      const corrected = [
        data.titulo_corregido, data.descripcion_corregida, data.amenaza_corregida,
        data.vulnerabilidad_corregida, data.consecuencia_corregida, data.recomendacion_corregida,
      ]
      if (!corrected.some((value) => value && value.trim())) {
        issue('titulo_corregido', M.CORRECTION_FIELD_REQUIRED)
      }
    }

    if (data.accion === RISK_DECISION_ACTION.RECHAZADA && tooShort(data.observacion, MIN_OBSERVATION)) {
      issue('observacion', M.REJECTION_REASON_MIN)
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
    if (data.accion !== RISK_DECISION_ACTION.CORREGIDA) return
    const changed = CORRECTABLE_FIELDS.some((f) => (data[f] ?? '').trim() !== original[f].trim())
    if (!changed) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['titulo_corregido'], message: M.CORRECTION_UNCHANGED })
    }
  })
