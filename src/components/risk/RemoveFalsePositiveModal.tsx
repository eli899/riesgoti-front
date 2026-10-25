import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MinusCircle } from 'lucide-react'
import FormAlert from '@/components/forms/FormAlert'
import { applyServerErrors } from '@/components/forms/applyServerErrors'
import { Button, Dialog, Field } from '@/components/ui'
import type { SubmitResult } from '@/lib/apiErrors'
import { cn } from '@/lib/utils'
import { removeIncidentFromGroupSchema, type RemoveIncidentFromGroupValues } from '@/schemas/riskEvaluation.schema'
import { inputClassName } from '@/styles/tokens.form'
import type { RiskLinkedIncident } from '@/types/domain.types'

interface RemoveFalsePositiveModalProps {
  incident: RiskLinkedIncident | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (incident: RiskLinkedIncident, values: RemoveIncidentFromGroupValues) => Promise<SubmitResult>
}

/** Retiro de un falso positivo de la agrupación con motivo obligatorio (VERSION_INCIDENCIA.motivo_retiro). */
export default function RemoveFalsePositiveModal({ incident, isSubmitting, onClose, onSubmit }: RemoveFalsePositiveModalProps) {
  return (
    <Dialog open={incident !== null} onClose={onClose} title="Retirar de la agrupación" sub={incident ? `${incident.reference} · ${incident.title}` : undefined}>
      {incident && <RemoveForm key={incident.analysisId} incident={incident} isSubmitting={isSubmitting} onClose={onClose} onSubmit={onSubmit} />}
    </Dialog>
  )
}

function RemoveForm({ incident, isSubmitting, onClose, onSubmit }: RemoveFalsePositiveModalProps & { incident: RiskLinkedIncident }) {
  const { register, handleSubmit, setError, formState: { errors } } = useForm<RemoveIncidentFromGroupValues>({
    resolver: zodResolver(removeIncidentFromGroupSchema),
    defaultValues: { motivo_retiro: '' },
  })

  const submit = handleSubmit(async (values) => {
    const failure = await onSubmit(incident, values)
    if (failure) applyServerErrors(failure, setError, ['motivo_retiro'])
    else onClose()
  })

  return (
    <form noValidate aria-label="Motivo del retiro del falso positivo" onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted">
        La incidencia no se elimina: queda en «Excluidas de la agrupación» con tu motivo como evidencia de la revisión.
        Si la agrupación ya estaba confirmada, deberás confirmarla de nuevo.
      </p>
      <FormAlert message={errors.root?.server?.message} />
      <fieldset>
        <legend className="sr-only">Justificación del retiro</legend>
        <Field id="remove-reason" label="Motivo del retiro" error={errors.motivo_retiro?.message}
          help="Ejemplo: coincidencia semántica por lentitud, pero el activo afectado es una impresora y no el servidor del ERP.">
          <textarea id="remove-reason" rows={4} autoFocus {...register('motivo_retiro')} aria-invalid={!!errors.motivo_retiro}
            aria-describedby={errors.motivo_retiro ? 'remove-reason-err' : 'remove-reason-help'} className={cn(inputClassName(!!errors.motivo_retiro), 'py-2')} />
        </Field>
      </fieldset>
      <footer className="flex flex-col-reverse gap-2 border-t border-line pt-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="danger" icon={<MinusCircle size={17} aria-hidden />} disabled={isSubmitting}>
          {isSubmitting ? 'Retirando…' : 'Retirar incidencia'}
        </Button>
      </footer>
    </form>
  )
}
