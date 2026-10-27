import { useState, type FormEvent } from 'react'
import { Button, Dialog, Field } from '@/components/ui'
import FormAlert from '@/components/forms/FormAlert'
import { cn } from '@/lib/utils'
import type { SubmitResult } from '@/lib/apiErrors'
import { fieldClassName, inputClassName } from '@/styles/tokens.form'
import { FIELD_LIMITS, VALIDATION_MESSAGES } from '@/constants/validation.constants'

interface PublishMatrixDialogProps {
  open: boolean
  currentName: string
  changedCells: number
  isPublishing: boolean
  onClose: () => void
  onPublish: (name: string) => Promise<SubmitResult>
}

/** Confirmación de publicación de una nueva CONFIGURACION_MATRIZ (las evaluaciones previas no cambian). */
export default function PublishMatrixDialog({ open, currentName, changedCells, isPublishing, onClose, onPublish }: PublishMatrixDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Guardar como nueva versión">
      {open && <PublishForm currentName={currentName} changedCells={changedCells} isPublishing={isPublishing} onClose={onClose} onPublish={onPublish} />}
    </Dialog>
  )
}

function PublishForm({ currentName, changedCells, isPublishing, onClose, onPublish }: Omit<PublishMatrixDialogProps, 'open'>) {
  const [name, setName] = useState(currentName)
  const [error, setError] = useState<string>()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (name.trim().length < FIELD_LIMITS.MATRIX_NAME_MIN) return setError(VALIDATION_MESSAGES.MATRIX.NAME_MIN)
    const failure = await onPublish(name.trim())
    if (failure) setError(failure.fieldErrors.nombre ?? failure.fieldErrors.celdas ?? failure.message)
    else onClose()
  }

  return (
    <form onSubmit={submit} noValidate aria-label="Publicación de matriz" className="space-y-4">
      <p className="text-base">
        Se publicará una nueva configuración con <strong>{changedCells} {changedCells === 1 ? 'celda modificada' : 'celdas modificadas'}</strong>. Las evaluaciones registradas en EVALUACION_RIESGO conservan la celda y la matriz con las que se hicieron.
      </p>
      <Field id="matrix-name" label="Nombre de la configuración">
        <input id="matrix-name" value={name} maxLength={FIELD_LIMITS.MATRIX_NAME_MAX} onChange={(e) => { setName(e.target.value); setError(undefined) }} className={cn(inputClassName(!!error), 'h-11 md:h-10')} />
      </Field>
      <FormAlert message={error} />
      <footer className={fieldClassName.footer}>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={isPublishing}>{isPublishing ? 'Publicando…' : 'Publicar versión'}</Button>
      </footer>
    </form>
  )
}
