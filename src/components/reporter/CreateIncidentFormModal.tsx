import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Paperclip, Send, X } from 'lucide-react'
import { Button, Dialog, Field, IconButton } from '@/components/ui'
import FormAlert from '@/components/forms/FormAlert'
import { applyServerErrors } from '@/components/forms/applyServerErrors'
import { formatSize } from '@/lib/format'
import { cn, inputClassName } from '@/lib/utils'
import type { ApiFailure } from '@/lib/apiErrors'
import { EVIDENCE_EXTENSIONS, incidentFormSchema, MAX_EVIDENCES_PER_INCIDENT, MAX_EVIDENCE_SIZE_BYTES, type IncidentFormValues } from '@/schemas/incident.schema'
import type { Asset } from '@/types/domain.types'

const FIELDS = ['titulo', 'descripcion', 'activo_reportado_id', 'activo_texto', 'evidencias'] as const

interface CreateIncidentFormModalProps {
  open: boolean
  assets: Asset[]
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: IncidentFormValues) => Promise<ApiFailure | undefined>
}

/** Registro de INCIDENCIA con evidencias opcionales (EVIDENCIA_INCIDENCIA). */
export default function CreateIncidentFormModal({ open, onClose, ...props }: CreateIncidentFormModalProps) {
  return (
    <Dialog open={open} onClose={onClose} wide title="Reportar incidencia" sub="La fecha y tu usuario se registran automáticamente.">
      {open && <IncidentForm onCancel={onClose} {...props} />}
    </Dialog>
  )
}

function IncidentForm({ assets, isSubmitting, onCancel, onSubmit }: Omit<CreateIncidentFormModalProps, 'open' | 'onClose'> & { onCancel: () => void }) {
  const { register, control, handleSubmit, setError, setValue, formState: { errors } } = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: { titulo: '', descripcion: '', activo_reportado_id: null, activo_texto: '', evidencias: [] },
  })
  // «Otro / No estoy seguro» es estado de interfaz: el contrato recibe activo_reportado_id = null + activo_texto.
  const [otherSelected, setOtherSelected] = useState(false)

  const submit = handleSubmit(async (values) => {
    const failure = await onSubmit(values)
    if (failure) applyServerErrors(failure, setError, FIELDS)
  })

  const input = (hasError: boolean) => cn(inputClassName(hasError), 'h-11 md:h-10')
  const describedBy = (id: string, hasError: boolean) => (hasError ? `${id}-err` : `${id}-help`)

  return (
    <form onSubmit={submit} noValidate aria-label="Reporte de incidencia" className="space-y-4">
      <FormAlert message={errors.root?.server?.message} />
      <fieldset className="space-y-4">
        <legend className="sr-only">Qué ocurrió</legend>
        <Field id="inc-titulo" label="Título breve" error={errors.titulo?.message} help="Ejemplo: El ERP está lento al guardar facturas">
          <input id="inc-titulo" maxLength={255} {...register('titulo')} aria-invalid={!!errors.titulo} aria-describedby={describedBy('inc-titulo', !!errors.titulo)} className={input(!!errors.titulo)} />
        </Field>
        <Field id="inc-activo" label="Activo afectado" error={errors.activo_reportado_id?.message} help="Si no aparece en la lista, elige «Otro / No estoy seguro».">
          <Controller control={control} name="activo_reportado_id" render={({ field }) => (
            <select id="inc-activo" ref={field.ref} name={field.name} onBlur={field.onBlur}
              value={otherSelected ? 'other' : field.value ?? ''}
              aria-invalid={!!errors.activo_reportado_id} aria-describedby={describedBy('inc-activo', !!errors.activo_reportado_id)} className={input(!!errors.activo_reportado_id)}
              onChange={(e) => {
                const other = e.target.value === 'other'
                setOtherSelected(other)
                setValue('activo_texto', '')
                field.onChange(other || e.target.value === '' ? null : Number(e.target.value))
              }}>
              <option value="">Selecciona un activo</option>
              {assets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              <option value="other">Otro / No estoy seguro</option>
            </select>
          )} />
        </Field>
        {otherSelected && (
          <Field id="inc-activo-texto" label="¿Qué recurso se vio afectado?" error={errors.activo_texto?.message} help="Describe el equipo, aplicación o servicio con tus palabras.">
            <input id="inc-activo-texto" maxLength={255} {...register('activo_texto')} aria-invalid={!!errors.activo_texto} className={input(!!errors.activo_texto)} />
          </Field>
        )}
        <Field id="inc-descripcion" label="Descripción detallada" error={errors.descripcion?.message} help="Qué ocurrió, desde cuándo y qué estabas haciendo. No incluyas contraseñas ni secretos.">
          <textarea id="inc-descripcion" rows={5} {...register('descripcion')} aria-invalid={!!errors.descripcion} aria-describedby={describedBy('inc-descripcion', !!errors.descripcion)} className={cn(inputClassName(!!errors.descripcion), 'py-2.5')} />
        </Field>
      </fieldset>
      <Controller control={control} name="evidencias" render={({ field }) => (
        <EvidenceDropzone files={field.value ?? []} error={errors.evidencias?.message} onChange={field.onChange} />
      )} />
      <footer className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" icon={<Send size={17} aria-hidden />} disabled={isSubmitting}>{isSubmitting ? 'Registrando…' : 'Registrar incidencia'}</Button>
      </footer>
    </form>
  )
}

function EvidenceDropzone({ files, error, onChange }: { files: File[]; error?: string; onChange: (files: File[]) => void }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: true,
    // Tipos y tamaños se validan con Zod (mensajes del contrato); aquí solo se acumulan los archivos.
    onDrop: (accepted, rejected) => onChange([...files, ...accepted, ...rejected.map((r) => r.file as File)]),
  })
  return (
    <fieldset>
      <legend className="mb-1.5 text-[13px] font-semibold">Evidencias <span className="font-normal text-muted">(opcional)</span></legend>
      <section {...getRootProps({ 'aria-label': 'Zona para arrastrar o seleccionar evidencias' })}
        className={cn('flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-[12px] border-2 border-dashed p-4 text-center text-[13px] transition-colors',
          isDragActive ? 'border-primary bg-line' : error ? 'border-deep bg-soft' : 'border-mid bg-soft hover:border-primary')}>
        <input {...getInputProps()} />
        <Paperclip size={20} className="text-primary-pressed" aria-hidden />
        <span className="font-semibold text-primary-pressed">{isDragActive ? 'Suelta los archivos aquí' : 'Adjuntar capturas, logs o documentos'}</span>
        <span className="text-[12px] text-muted">
          {EVIDENCE_EXTENSIONS.map((e) => e.slice(1).toUpperCase()).join(', ')} · máximo {MAX_EVIDENCE_SIZE_BYTES / (1024 * 1024)} MB por archivo y {MAX_EVIDENCES_PER_INCIDENT} archivos. Los archivos nunca se ejecutan.
        </span>
      </section>
      {error && <p id="inc-evidencias-err" role="alert" className="mt-1 text-[12px] font-medium text-deep">{error}</p>}
      {files.length > 0 && (
        <ul className="mt-3 space-y-2" aria-label="Evidencias seleccionadas">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-[10px] border border-line p-2 text-[13px]">
              <Paperclip size={16} className="shrink-0 text-primary" aria-hidden />
              <span className="min-w-0 flex-1 truncate font-medium">{f.name}</span>
              <span className="text-muted">{formatSize(f.size)}</span>
              <IconButton label={`Quitar ${f.name}`} className="size-9" onClick={() => onChange(files.filter((_, j) => j !== i))}><X size={16} aria-hidden /></IconButton>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  )
}
