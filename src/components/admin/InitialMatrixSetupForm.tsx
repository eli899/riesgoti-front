import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Grid3x3 } from 'lucide-react'
import Matrix5x5EditorGrid from '@/components/admin/Matrix5x5EditorGrid'
import { Button, Card, Field, SectionTitle } from '@/components/ui'
import FormAlert from '@/components/forms/FormAlert'
import { cn } from '@/lib/utils'
import type { SubmitResult } from '@/lib/apiErrors'
import { initialMatrixSchema, type InitialMatrixFormValues } from '@/schemas/initialMatrix.schema'
import { inputClassName } from '@/styles/tokens.form'
import type { MatrixCriterion, RiskLevelCode } from '@/types/domain.types'

interface InitialMatrixSetupFormProps {
  levelAt: (probability: number, impact: number) => RiskLevelCode
  isChanged: (probability: number, impact: number) => boolean
  onCycle: (probability: number, impact: number) => void
  isPublishing: boolean
  onSubmit: (values: InitialMatrixFormValues) => Promise<SubmitResult>
}

// Escala sugerida (ISO/IEC 27005); el administrador puede renombrarla antes de publicar.
const DEFAULT_VALUES: InitialMatrixFormValues = {
  name: 'Matriz corporativa ISO 27005',
  probabilityCriteria: ['Rara', 'Improbable', 'Posible', 'Probable', 'Casi segura'].map((name, i) => ({ value: i + 1, name, description: '' })),
  impactCriteria: ['Insignificante', 'Menor', 'Moderado', 'Mayor', 'Severo'].map((name, i) => ({ value: i + 1, name, description: '' })),
}

type CriteriaField = 'probabilityCriteria' | 'impactCriteria'

/** Asistente de la primera CONFIGURACION_MATRIZ: nombre, criterios 1..5 y nivel por celda (CHG-0039). */
export default function InitialMatrixSetupForm({ levelAt, isChanged, onCycle, isPublishing, onSubmit }: InitialMatrixSetupFormProps) {
  const { register, control, handleSubmit, setError, formState: { errors } } = useForm<InitialMatrixFormValues>({
    resolver: zodResolver(initialMatrixSchema),
    defaultValues: DEFAULT_VALUES,
  })
  const [probability, impact] = useWatch({ control, name: ['probabilityCriteria', 'impactCriteria'] })
  const toCriteria = (items: InitialMatrixFormValues[CriteriaField]): MatrixCriterion[] =>
    items.map((c) => ({ value: c.value, name: c.name || `Nivel ${c.value}`, description: null }))

  const submit = handleSubmit(async (values) => {
    const failure = await onSubmit(values)
    if (failure) setError('root.server', { message: failure.fieldErrors.criterios ?? failure.fieldErrors.celdas ?? failure.message })
  })

  const criteriaFieldset = (field: CriteriaField, legend: string, help: string) => (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold">{legend}</legend>
      <p className="text-xs text-muted">{help}</p>
      <ol className="space-y-2">
        {DEFAULT_VALUES[field].map((criterion, index) => {
          const error = errors[field]?.[index]?.name?.message
          const id = `${field}-${criterion.value}`
          return (
            <li key={criterion.value} className="flex items-start gap-2">
              <span className="mt-2 grid size-7 shrink-0 place-items-center rounded-full bg-soft font-mono text-sm font-semibold text-primary" aria-hidden>{criterion.value}</span>
              <span className="min-w-0 flex-1">
                <label htmlFor={id} className="sr-only">{legend}: nombre del valor {criterion.value}</label>
                <input id={id} {...register(`${field}.${index}.name`)} aria-invalid={!!error} className={cn(inputClassName(!!error), 'h-10')} />
                {error && <span role="alert" className="mt-1 block text-xs font-medium text-danger">{error}</span>}
              </span>
            </li>
          )
        })}
      </ol>
    </fieldset>
  )

  return (
    <form onSubmit={submit} noValidate aria-label="Configuración inicial de la matriz de riesgo" className="space-y-4">
      <Card className="flex items-start gap-3 border-mid bg-soft p-4">
        <Grid3x3 size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden />
        <p className="text-sm text-primary-pressed">
          Aún no hay una matriz de riesgo publicada. Mientras no exista, los analistas no pueden evaluar riesgos. Revisa la escala sugerida, ajústala si lo necesitas y publícala.
        </p>
      </Card>
      <FormAlert message={errors.root?.server?.message} />

      <Card className="space-y-4 p-4 md:p-5">
        <Field id="initial-matrix-name" label="Nombre de la matriz" error={errors.name?.message}>
          <input id="initial-matrix-name" {...register('name')} aria-invalid={!!errors.name} className={cn(inputClassName(!!errors.name), 'h-11 md:h-10')} />
        </Field>
        <section className="grid gap-6 md:grid-cols-2" aria-label="Criterios de la matriz">
          {criteriaFieldset('probabilityCriteria', 'Criterios de probabilidad', '1 = menos probable · 5 = más probable.')}
          {criteriaFieldset('impactCriteria', 'Criterios de impacto', '1 = menor impacto · 5 = mayor impacto.')}
        </section>
      </Card>

      <Card aria-labelledby="initial-matrix-grid-title" className="p-4 md:p-5">
        <SectionTitle id="initial-matrix-grid-title">Nivel de riesgo por celda</SectionTitle>
        <p className="mb-3 mt-1 text-sm text-muted">
          Cada celda trae un nivel sugerido según probabilidad × impacto. Selecciona una celda (o usa las flechas y Enter) para cambiarlo.
        </p>
        <Matrix5x5EditorGrid probabilityCriteria={toCriteria(probability)} impactCriteria={toCriteria(impact)} levelAt={levelAt} isChanged={isChanged} onCycle={onCycle} />
      </Card>

      <footer className="flex justify-end">
        <Button type="submit" disabled={isPublishing}>{isPublishing ? 'Publicando…' : 'Publicar matriz inicial'}</Button>
      </footer>
    </form>
  )
}
