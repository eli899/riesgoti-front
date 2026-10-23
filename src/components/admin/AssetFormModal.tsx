import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Dialog, Field } from '@/components/ui'
import FormAlert from '@/components/forms/FormAlert'
import { applyServerErrors } from '@/components/forms/applyServerErrors'
import { RISK_LEVEL_LABEL } from '@/lib/labels'
import { cn, inputClassName } from '@/lib/utils'
import type { SubmitResult } from '@/lib/apiErrors'
import { assetFormSchema, type AssetFormValues } from '@/schemas/asset.schema'
import type { AssetType } from '@/types/domain.types'

const CRITICALITY_OPTIONS = [
  { value: 1, label: RISK_LEVEL_LABEL.BAJO },
  { value: 2, label: RISK_LEVEL_LABEL.MEDIO },
  { value: 3, label: RISK_LEVEL_LABEL.ALTO },
  { value: 4, label: RISK_LEVEL_LABEL.CRITICO },
]
const FIELDS = ['tipo_id', 'codigo', 'nombre', 'descripcion', 'criticidad', 'activo'] as const

interface AssetFormModalProps {
  open: boolean
  isNew: boolean
  defaultValues: AssetFormValues
  assetTypes: AssetType[]
  isSaving: boolean
  onClose: () => void
  onSubmit: (values: AssetFormValues) => Promise<SubmitResult>
}

/** Alta y edición de ACTIVO. */
export default function AssetFormModal({ open, isNew, ...props }: AssetFormModalProps) {
  return (
    <Dialog open={open} onClose={props.onClose} title={isNew ? 'Nuevo activo' : 'Editar activo'}>
      {open && <AssetForm {...props} />}
    </Dialog>
  )
}

function AssetForm({ defaultValues, assetTypes, isSaving, onClose, onSubmit }: Omit<AssetFormModalProps, 'open' | 'isNew'>) {
  const { register, handleSubmit, setError, formState: { errors } } = useForm<AssetFormValues>({ resolver: zodResolver(assetFormSchema), defaultValues })

  const submit = handleSubmit(async (values) => {
    const failure = await onSubmit(values)
    if (failure) applyServerErrors(failure, setError, FIELDS)
    else onClose()
  })
  const input = (hasError: boolean) => cn(inputClassName(hasError), 'h-11 md:h-10')

  return (
    <form onSubmit={submit} noValidate aria-label="Datos del activo" className="space-y-4">
      <FormAlert message={errors.root?.server?.message} />
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="sr-only">Identificación</legend>
        <Field id="asset-codigo" label="Código" error={errors.codigo?.message} help="Se guarda en mayúsculas.">
          <input id="asset-codigo" {...register('codigo')} aria-invalid={!!errors.codigo} className={input(!!errors.codigo)} />
        </Field>
        <Field id="asset-tipo" label="Tipo" error={errors.tipo_id?.message}>
          <select id="asset-tipo" {...register('tipo_id', { valueAsNumber: true })} aria-invalid={!!errors.tipo_id} className={input(!!errors.tipo_id)}>
            <option value={0} disabled>Selecciona un tipo</option>
            {assetTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
      </fieldset>
      <Field id="asset-nombre" label="Nombre" error={errors.nombre?.message}>
        <input id="asset-nombre" {...register('nombre')} aria-invalid={!!errors.nombre} className={input(!!errors.nombre)} />
      </Field>
      <Field id="asset-criticidad" label="Criticidad" error={errors.criticidad?.message} help="Solo visible para perfiles autorizados.">
        <select id="asset-criticidad" {...register('criticidad', { setValueAs: (v) => (v === '' || v === null ? null : Number(v)) })} className={input(!!errors.criticidad)}>
          <option value="">Sin criticidad</option>
          {CRITICALITY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </Field>
      <Field id="asset-descripcion" label="Descripción" optional error={errors.descripcion?.message}>
        <textarea id="asset-descripcion" rows={3} {...register('descripcion')} className={cn(inputClassName(!!errors.descripcion), 'py-2')} />
      </Field>
      <footer className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={isSaving}>{isSaving ? 'Guardando…' : 'Guardar'}</Button>
      </footer>
    </form>
  )
}
