import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Dialog, Field } from '@/components/ui'
import FormAlert from '@/components/forms/FormAlert'
import { applyServerErrors } from '@/components/forms/applyServerErrors'
import { cn } from '@/lib/utils'
import type { SubmitResult } from '@/lib/apiErrors'
import { assetTypeFormSchema, type AssetTypeFormValues } from '@/schemas/assetType.schema'
import { fieldClassName, inputClassName } from '@/styles/tokens.form'
import type { AssetType } from '@/types/domain.types'

const FIELDS = ['nombre'] as const

interface AssetTypeFormModalProps {
  /** undefined: cerrado · null: nuevo tipo · AssetType: edición. */
  type: AssetType | null | undefined
  isSaving: boolean
  onClose: () => void
  onSubmit: (values: AssetTypeFormValues, typeId: number | null) => Promise<SubmitResult>
}

/** Alta y edición de TIPO_ACTIVO (CHG-0039). */
export default function AssetTypeFormModal({ type, isSaving, onClose, onSubmit }: AssetTypeFormModalProps) {
  return (
    <Dialog open={type !== undefined} onClose={onClose} title={type ? 'Editar tipo de activo' : 'Nuevo tipo de activo'}>
      {type !== undefined && <AssetTypeForm key={type?.id ?? 'new'} type={type} isSaving={isSaving} onClose={onClose} onSubmit={onSubmit} />}
    </Dialog>
  )
}

function AssetTypeForm({ type, isSaving, onClose, onSubmit }: Omit<AssetTypeFormModalProps, 'type'> & { type: AssetType | null }) {
  const { register, handleSubmit, setError, formState: { errors } } = useForm<AssetTypeFormValues>({
    resolver: zodResolver(assetTypeFormSchema),
    defaultValues: { nombre: type?.name ?? '' },
  })

  const submit = handleSubmit(async (values) => {
    const failure = await onSubmit(values, type?.id ?? null)
    if (failure) applyServerErrors(failure, setError, FIELDS)
    else onClose()
  })

  return (
    <form onSubmit={submit} noValidate aria-label="Datos del tipo de activo" className="space-y-4">
      <FormAlert message={errors.root?.server?.message} />
      <Field id="asset-type-nombre" label="Nombre" error={errors.nombre?.message} help="Ej. Aplicación, Servidor, Infraestructura de red.">
        <input id="asset-type-nombre" {...register('nombre')} aria-invalid={!!errors.nombre} className={cn(inputClassName(!!errors.nombre), 'h-11 md:h-10')} />
      </Field>
      <footer className={fieldClassName.footer}>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={isSaving}>{isSaving ? 'Guardando…' : 'Guardar'}</Button>
      </footer>
    </form>
  )
}
