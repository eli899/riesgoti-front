import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save } from 'lucide-react'
import { Button, Dialog, Field } from '@/components/ui'
import FormAlert from '@/components/forms/FormAlert'
import { applyServerErrors } from '@/components/forms/applyServerErrors'
import { cn } from '@/lib/utils'
import type { SubmitResult } from '@/lib/apiErrors'
import { incidentEditSchema, type IncidentEditValues } from '@/schemas/incident.schema'
import { fieldClassName, inputClassName } from '@/styles/tokens.form'
import type { Asset, Incident } from '@/types/domain.types'
import { FIELD_LIMITS } from '@/constants/validation.constants'

const FIELDS = ['titulo', 'descripcion', 'activo_reportado_id', 'activo_texto'] as const

interface EditIncidentFormModalProps {
  open: boolean
  incident: Incident
  assets: Asset[]
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: IncidentEditValues) => Promise<SubmitResult>
}

/** Corrección de los datos declarados de una INCIDENCIA propia; las evidencias y el análisis de IA no cambian. */
export default function EditIncidentFormModal({ open, onClose, ...props }: EditIncidentFormModalProps) {
  return (
    <Dialog open={open} onClose={onClose} wide title={`Editar ${props.incident.reference}`} sub="El análisis automático ya realizado no se repite.">
      {open && <EditIncidentForm onCancel={onClose} onDone={onClose} {...props} />}
    </Dialog>
  )
}

function EditIncidentForm({ incident, assets, isSubmitting, onCancel, onDone, onSubmit }: Omit<EditIncidentFormModalProps, 'open' | 'onClose'> & { onCancel: () => void; onDone: () => void }) {
  const { register, control, handleSubmit, setError, setValue, formState: { errors, isDirty } } = useForm<IncidentEditValues>({
    resolver: zodResolver(incidentEditSchema),
    defaultValues: {
      titulo: incident.title,
      descripcion: incident.description,
      activo_reportado_id: incident.assetId,
      activo_texto: incident.assetFreeText ?? '',
    },
  })
  const [otherSelected, setOtherSelected] = useState(incident.assetId === null)

  const submit = handleSubmit(async (values) => {
    const failure = await onSubmit(values)
    if (failure) applyServerErrors(failure, setError, FIELDS)
    else onDone()
  })

  const input = (hasError: boolean) => cn(inputClassName(hasError), 'h-11 md:h-10')

  return (
    <form onSubmit={submit} noValidate aria-label="Edición de incidencia" className="space-y-4">
      <FormAlert message={errors.root?.server?.message} />
      <fieldset className="space-y-4">
        <legend className="sr-only">Datos de la incidencia</legend>
        <Field id="edit-inc-titulo" label="Título breve" error={errors.titulo?.message}>
          <input id="edit-inc-titulo" maxLength={FIELD_LIMITS.INCIDENT_TITLE_MAX} {...register('titulo')} aria-invalid={!!errors.titulo} className={input(!!errors.titulo)} />
        </Field>
        <Field id="edit-inc-activo" label="Activo afectado" error={errors.activo_reportado_id?.message}>
          <Controller control={control} name="activo_reportado_id" render={({ field }) => (
            <select id="edit-inc-activo" ref={field.ref} name={field.name} onBlur={field.onBlur}
              value={otherSelected ? 'other' : field.value ?? ''}
              aria-invalid={!!errors.activo_reportado_id} className={input(!!errors.activo_reportado_id)}
              onChange={(e) => {
                const other = e.target.value === 'other'
                setOtherSelected(other)
                if (!other) setValue('activo_texto', '')
                field.onChange(other || e.target.value === '' ? null : Number(e.target.value))
              }}>
              <option value="">Selecciona un activo</option>
              {assets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              <option value="other">Otro / No estoy seguro</option>
            </select>
          )} />
        </Field>
        {otherSelected && (
          <Field id="edit-inc-activo-texto" label="¿Qué recurso se vio afectado?" error={errors.activo_texto?.message}>
            <input id="edit-inc-activo-texto" maxLength={FIELD_LIMITS.INCIDENT_ASSET_TEXT_MAX} {...register('activo_texto')} aria-invalid={!!errors.activo_texto} className={input(!!errors.activo_texto)} />
          </Field>
        )}
        <Field id="edit-inc-descripcion" label="Descripción detallada" error={errors.descripcion?.message} help="No incluyas contraseñas ni secretos.">
          <textarea id="edit-inc-descripcion" rows={5} {...register('descripcion')} aria-invalid={!!errors.descripcion} className={cn(inputClassName(!!errors.descripcion), 'py-2.5')} />
        </Field>
      </fieldset>
      <footer className={fieldClassName.footer}>
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" icon={<Save size={17} aria-hidden />} disabled={isSubmitting || !isDirty}>{isSubmitting ? 'Guardando…' : 'Guardar cambios'}</Button>
      </footer>
    </form>
  )
}
