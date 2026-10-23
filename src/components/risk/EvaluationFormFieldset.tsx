import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Info, Save } from 'lucide-react'
import FormAlert from '@/components/forms/FormAlert'
import { applyServerErrors } from '@/components/forms/applyServerErrors'
import { Button, Field, RiskLevelBadge } from '@/components/ui'
import type { SubmitResult } from '@/lib/apiErrors'
import { formatDateTime } from '@/lib/format'
import { cn, inputClassName } from '@/lib/utils'
import { riskEvaluateSchema, type RiskEvaluateValues } from '@/schemas/riskEvaluation.schema'
import type { MatrixConfig, RiskEvaluation, RiskLevelCode } from '@/types/domain.types'
import InteractiveRiskMatrix5x5Grid from './InteractiveRiskMatrix5x5Grid'

interface EvaluationFormFieldsetProps {
  matrix: MatrixConfig
  levelAt: (probability: number, impact: number) => RiskLevelCode | null
  evaluation: RiskEvaluation | null
  editable: boolean
  evaluatedWithPreviousMatrix: boolean
  isSaving: boolean
  onSave: (values: RiskEvaluateValues) => Promise<SubmitResult>
}

const toNumber = (v: unknown) => (v === '' || v === undefined || v === null ? undefined : Number(v))

/**
 * Evaluación en la matriz 5x5 activa: los selectores de probabilidad e impacto y la grilla comparten el mismo estado
 * del formulario; el nivel resultante se lee de CELDA_MATRIZ y se guarda en EVALUACION_RIESGO.
 */
export default function EvaluationFormFieldset({ matrix, levelAt, evaluation, editable, evaluatedWithPreviousMatrix, isSaving, onSave }: EvaluationFormFieldsetProps) {
  const { register, handleSubmit, setValue, setError, control, formState: { errors, isDirty } } = useForm<RiskEvaluateValues>({
    resolver: zodResolver(riskEvaluateSchema),
    defaultValues: { probabilidad: evaluation?.probability, impacto: evaluation?.impact, justificacion: evaluation?.justification ?? '' },
  })
  const [probability, impact] = useWatch({ control, name: ['probabilidad', 'impacto'] })
  const selected = probability && impact ? { probability, impact } : null
  const level = selected ? levelAt(selected.probability, selected.impact) : null
  const pName = matrix.probabilityCriteria.find((c) => c.value === probability)?.name
  const iName = matrix.impactCriteria.find((c) => c.value === impact)?.name

  const pick = (p: number, i: number) => {
    setValue('probabilidad', p, { shouldDirty: true, shouldValidate: !!errors.probabilidad })
    setValue('impacto', i, { shouldDirty: true, shouldValidate: !!errors.impacto })
  }

  const submit = handleSubmit(async (values) => {
    const failure = await onSave(values)
    if (failure) applyServerErrors(failure, setError, ['probabilidad', 'impacto', 'justificacion'])
  })

  return (
    <form noValidate aria-label="Evaluación en la matriz 5x5" onSubmit={submit} className="space-y-4">
      <FormAlert message={errors.root?.server?.message} />
      <fieldset disabled={!editable} className="min-w-0 space-y-4">
        <legend className="sr-only">Probabilidad, impacto y justificación de la evaluación</legend>
        <section className="grid gap-3 sm:grid-cols-2" aria-label="Selección de criterios">
          <Field id="eval-probability" label="Probabilidad" error={errors.probabilidad?.message}>
            <select id="eval-probability" {...register('probabilidad', { setValueAs: toNumber })} aria-invalid={!!errors.probabilidad}
              className={cn(inputClassName(!!errors.probabilidad), 'h-11 md:h-10')}>
              <option value="">Selecciona un criterio</option>
              {[...matrix.probabilityCriteria].sort((a, b) => b.value - a.value).map((c) => (
                <option key={c.value} value={c.value}>{c.value} · {c.name}{c.description ? ` — ${c.description}` : ''}</option>
              ))}
            </select>
          </Field>
          <Field id="eval-impact" label="Impacto" error={errors.impacto?.message}>
            <select id="eval-impact" {...register('impacto', { setValueAs: toNumber })} aria-invalid={!!errors.impacto}
              className={cn(inputClassName(!!errors.impacto), 'h-11 md:h-10')}>
              <option value="">Selecciona un criterio</option>
              {[...matrix.impactCriteria].sort((a, b) => a.value - b.value).map((c) => (
                <option key={c.value} value={c.value}>{c.value} · {c.name}{c.description ? ` — ${c.description}` : ''}</option>
              ))}
            </select>
          </Field>
        </section>

        <InteractiveRiskMatrix5x5Grid probabilityCriteria={matrix.probabilityCriteria} impactCriteria={matrix.impactCriteria} levelAt={levelAt}
          selected={selected} onSelect={editable ? pick : undefined} />

        <output htmlFor="eval-probability eval-impact" aria-live="polite" className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-line p-3">
          <span className="text-[13px] font-semibold">
            Nivel resultante{selected && <span className="ml-1 font-normal text-muted">· P{selected.probability} {pName} × I{selected.impact} {iName}</span>}
          </span>
          <RiskLevelBadge level={level} />
        </output>

        <Field id="eval-justification" label="Justificación de la evaluación" error={errors.justificacion?.message}
          help="Explica por qué eliges esta probabilidad e impacto (mínimo 15 caracteres).">
          <textarea id="eval-justification" rows={3} {...register('justificacion')} aria-invalid={!!errors.justificacion}
            className={cn(inputClassName(!!errors.justificacion), 'py-2')} />
        </Field>
      </fieldset>

      {evaluation && (
        <p className="text-[12px] text-muted">
          Evaluación guardada por {evaluation.evaluator.name} · {formatDateTime(evaluation.evaluatedAt)} · Matriz {evaluation.matrix.name} {evaluation.matrix.version}
        </p>
      )}
      {evaluatedWithPreviousMatrix && (
        <p className="flex items-start gap-2 rounded-[10px] bg-soft p-3 text-[12px] text-primary-pressed">
          <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
          La evaluación guardada usa una matriz anterior y conserva su celda histórica. Guardar de nuevo la evaluará con la matriz activa ({matrix.name} {matrix.version}).
        </p>
      )}
      {editable && (
        <footer>
          <Button type="submit" variant="secondary" icon={<Save size={17} aria-hidden />} disabled={isSaving || (!!evaluation && !isDirty && !evaluatedWithPreviousMatrix)}>
            {isSaving ? 'Guardando…' : evaluation ? 'Actualizar evaluación' : 'Guardar evaluación'}
          </Button>
        </footer>
      )}
      <p className="text-[11.5px] text-muted">Referencia de gestión: ISO/IEC 27005. La criticidad del activo es un dato de apoyo y no sustituye el impacto.</p>
    </form>
  )
}
