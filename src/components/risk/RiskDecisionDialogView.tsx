import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Pencil, XCircle } from 'lucide-react'
import FormAlert from '@/components/forms/FormAlert'
import { applyServerErrors } from '@/components/forms/applyServerErrors'
import { Button, Dialog, Field, KV, RiskLevelBadge } from '@/components/ui'
import type { SubmitResult } from '@/lib/apiErrors'
import { cn, inputClassName } from '@/lib/utils'
import {
  riskDecisionFormSchema,
  type CorrectableField,
  type RiskDecisionFormValues,
} from '@/schemas/riskEvaluation.schema'
import type { RiskDecisionAction, RiskVersion } from '@/types/domain.types'

interface RiskDecisionDialogViewProps {
  action: RiskDecisionAction | null
  version: RiskVersion
  defaults: RiskDecisionFormValues
  correctionDefaults: Record<CorrectableField, string>
  validationBlockers: string[]
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: RiskDecisionFormValues) => Promise<SubmitResult>
}

const TITLE: Record<RiskDecisionAction, string> = {
  VALIDADA: 'Validar propuesta',
  CORREGIDA: 'Corregir propuesta',
  RECHAZADA: 'Rechazar propuesta',
}

const CORRECTION_FIELDS: { name: CorrectableField; label: string; rows: number; help?: string }[] = [
  { name: 'titulo_corregido', label: 'Riesgo (título)', rows: 1 },
  { name: 'descripcion_corregida', label: 'Descripción del riesgo', rows: 3 },
  { name: 'amenaza_corregida', label: 'Amenaza', rows: 2 },
  { name: 'vulnerabilidad_corregida', label: 'Vulnerabilidad', rows: 2, help: 'Déjala como está si no está sustentada.' },
  { name: 'consecuencia_corregida', label: 'Consecuencia', rows: 2 },
  { name: 'recomendacion_corregida', label: 'Recomendación', rows: 4 },
]

// Precondiciones de VALIDADA que no son campos editables del diálogo: se muestran como alerta global.
const PRECONDITION_FIELDS = ['activo_confirmado_id', 'agrupacion_confirmada', 'probabilidad', 'impacto', 'justificacion'] as const

/** Diálogo de decisión ISO/IEC 27005 sobre la versión (DECISION_RIESGO) validado con zodResolver(riskDecisionSchema). */
export default function RiskDecisionDialogView(props: RiskDecisionDialogViewProps) {
  const { action, version, onClose } = props
  return (
    <Dialog open={action !== null} onClose={onClose} size={action === 'CORREGIDA' ? 'lg' : 'md'}
      title={action ? TITLE[action] : ''} sub={`${version.riskCode} v${version.number} · ${version.title}`}>
      {action && <DecisionForm key={action} {...props} action={action} />}
    </Dialog>
  )
}

function DecisionForm({ action, version, defaults, correctionDefaults, validationBlockers, isSubmitting, onClose, onSubmit }: RiskDecisionDialogViewProps & { action: RiskDecisionAction }) {
  const schema = useMemo(() => riskDecisionFormSchema(correctionDefaults), [correctionDefaults])
  const { register, handleSubmit, setError, formState: { errors } } = useForm<RiskDecisionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...defaults, ...correctionDefaults, accion: action },
  })

  const submit = handleSubmit(async (values) => {
    const failure = await onSubmit(values)
    if (failure) applyServerErrors(failure, setError, ['observacion', 'justificacion_sin_fuentes', ...CORRECTION_FIELDS.map((f) => f.name)])
    else onClose()
  })

  const preconditionErrors = PRECONDITION_FIELDS.map((f) => errors[f]?.message).filter(Boolean)
  const area = (hasError: boolean) => cn(inputClassName(hasError), 'py-2')
  const isValidation = action === 'VALIDADA'

  return (
    <form noValidate aria-label={TITLE[action]} onSubmit={submit} className="space-y-4">
      <section aria-label="Resumen de la versión" className="rounded-[12px] border border-line p-3">
        <dl className="grid gap-x-4 text-[13px] sm:grid-cols-2">
          <KV k="Activo confirmado" v={version.confirmedAsset?.name ?? 'Sin confirmar'} nd={!version.confirmedAsset} />
          <KV k="Evaluación" v={version.evaluation ? <RiskLevelBadge level={version.evaluation.levelCode} /> : 'Sin evaluación'} nd={!version.evaluation} />
          <KV k="Incidencias agrupadas" v={`${version.includedIncidentCount}`} />
          <KV k="Fuentes estratégicas" v={version.citations.length ? `${version.citations.length} citas` : 'Sin respaldo documental'} nd={!version.citations.length} />
        </dl>
      </section>

      {isValidation && validationBlockers.length > 0 && (
        <section role="alert" className="rounded-[10px] border-2 border-deep bg-soft p-3 text-[13px]">
          <p className="mb-1 font-semibold text-deep">Antes de validar:</p>
          <ul className="list-inside list-disc">{validationBlockers.map((b) => <li key={b}>{b}</li>)}</ul>
        </section>
      )}
      <FormAlert message={errors.root?.server?.message ?? (preconditionErrors.length ? preconditionErrors.join(' ') : undefined)} />

      <fieldset className="min-w-0 space-y-3">
        <legend className="mb-1 text-[13px] text-muted">
          {isValidation && 'Se registrará la validación con tu identidad y fecha. Validar no ejecuta controles ni cierra incidencias.'}
          {action === 'CORREGIDA' && `Se registrará la decisión sobre v${version.number} y se creará la versión v${version.number + 1} del analista con los campos modificados; la versión actual se conserva como antecedente.`}
          {action === 'RECHAZADA' && 'Rechazar no requiere evaluación ni confirmación del activo. La versión se conserva en el historial.'}
        </legend>

        {isValidation && !version.hasStrategicCitations && (
          <Field id="decision-no-sources" label="Justificación de validación sin fuentes documentales" error={errors.justificacion_sin_fuentes?.message}
            help="La propuesta no cita fuentes estratégicas: explica por qué la validas igualmente (mínimo 15 caracteres).">
            <textarea id="decision-no-sources" rows={3} {...register('justificacion_sin_fuentes')} aria-invalid={!!errors.justificacion_sin_fuentes} className={area(!!errors.justificacion_sin_fuentes)} />
          </Field>
        )}

        {action === 'CORREGIDA' && (
          <fieldset className="min-w-0 space-y-3 rounded-[12px] border border-line p-3">
            <legend className="px-1 text-[13px] font-semibold">Contenido corregido</legend>
            {CORRECTION_FIELDS.map((f) => (
              <Field key={f.name} id={`decision-${f.name}`} label={f.label} error={errors[f.name]?.message} help={f.help}>
                <textarea id={`decision-${f.name}`} rows={f.rows} {...register(f.name)} aria-invalid={!!errors[f.name]} className={area(!!errors[f.name])} />
              </Field>
            ))}
          </fieldset>
        )}

        <Field id="decision-observation" label={action === 'RECHAZADA' ? 'Motivo del rechazo' : 'Observación'} error={errors.observacion?.message}
          help="Mínimo 10 caracteres. Queda registrada en la decisión y en la auditoría.">
          <textarea id="decision-observation" rows={3} {...register('observacion')} aria-invalid={!!errors.observacion} className={area(!!errors.observacion)} />
        </Field>
      </fieldset>

      <footer className="flex flex-col-reverse gap-2 border-t border-line pt-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        {isValidation && <Button type="submit" icon={<CheckCircle2 size={18} aria-hidden />} disabled={isSubmitting || validationBlockers.length > 0}>{isSubmitting ? 'Registrando…' : 'Registrar validación'}</Button>}
        {action === 'CORREGIDA' && <Button type="submit" icon={<Pencil size={18} aria-hidden />} disabled={isSubmitting}>{isSubmitting ? 'Guardando…' : 'Guardar corrección'}</Button>}
        {action === 'RECHAZADA' && <Button type="submit" variant="danger" icon={<XCircle size={18} aria-hidden />} disabled={isSubmitting}>{isSubmitting ? 'Rechazando…' : 'Rechazar propuesta'}</Button>}
      </footer>
    </form>
  )
}
