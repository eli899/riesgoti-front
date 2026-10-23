import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Archive, Headset, Info, Save, Wrench } from 'lucide-react'
import { Button, Field, KV } from '@/components/ui'
import FormAlert from '@/components/forms/FormAlert'
import { applyServerErrors } from '@/components/forms/applyServerErrors'
import { formatDateTime } from '@/lib/format'
import { cn, inputClassName } from '@/lib/utils'
import type { SubmitResult } from '@/lib/apiErrors'
import { humanAttentionSchema, type HumanAttentionFormValues } from '@/schemas/incident.schema'
import type { IncidentDetail } from '@/types/domain.types'

interface HumanAttentionFormAsideProps {
  incident: IncidentDetail
  canAttend: boolean
  assignedToMe: boolean
  isStarting: boolean
  isSaving: boolean
  onStart: () => void
  onSave: (values: HumanAttentionFormValues) => Promise<SubmitResult>
}

const NORMATIVE_NOTICE = 'Cerrar la incidencia no valida ni rechaza el riesgo asociado, ni inyecta estas notas automáticamente al índice RAG.'

/** Atención de incidencias N2 (ATENCION_INCIDENCIA): iniciar, guardar avance y cerrar con validación Zod. */
export default function HumanAttentionFormAside({ incident, canAttend, assignedToMe, isStarting, isSaving, onStart, onSave }: HumanAttentionFormAsideProps) {
  const attention = incident.attention
  return (
    <section aria-labelledby="attention-title" className="rounded-[18px] border border-line bg-white p-4 shadow-card md:rounded-[14px]">
      <h2 id="attention-title" className="mb-3 flex items-center gap-2 text-[15px] font-semibold"><Wrench size={18} className="text-primary" aria-hidden />Atención de incidencias (N2)</h2>

      {!canAttend ? (
        <p className="text-[13px] text-muted">Tu rol no tiene permiso para atender casos.</p>
      ) : incident.status === 'CERRADA' ? (
        <dl>
          <KV k="Resultado" v={attention?.closedAt ? 'Cerrada por atención humana' : incident.guidanceResult === 'FUNCIONO' ? 'Resuelta mediante orientación automática' : 'Cerrada'} />
          {attention && (
            <>
              <KV k="Acciones realizadas" v={<span className="whitespace-pre-line">{attention.actions || '—'}</span>} />
              <KV k="Nota de resolución" v={<span className="whitespace-pre-line">{attention.resolutionNote || '—'}</span>} />
              <KV k="Cerrada por" v={`${attention.analyst.name}${attention.closedAt ? ` · ${formatDateTime(attention.closedAt)}` : ''}`} />
            </>
          )}
        </dl>
      ) : incident.status === 'PENDIENTE_ATENCION_HUMANA' ? (
        <>
          <p className="mb-3 text-[13px] text-muted">Inicia la atención para asignarte el caso, registrar acciones y cerrarlo.</p>
          <Button full icon={<Headset size={18} aria-hidden />} disabled={isStarting} onClick={onStart}>{isStarting ? 'Iniciando…' : 'Iniciar atención'}</Button>
        </>
      ) : incident.status === 'EN_ATENCION' && attention ? (
        assignedToMe ? (
          <AttentionForm key={attention.startedAt} incident={incident} isSaving={isSaving} onSave={onSave} />
        ) : (
          <p className="text-[13px] text-muted">
            Este caso está siendo atendido por <strong className="text-ink">{attention.analyst.name}</strong> desde el {formatDateTime(attention.startedAt)}:
            Solo el analista asignado puede registrar la atención.
          </p>
        )
      ) : (
        <p className="text-[13px] text-muted">El caso aún está en análisis automático: el reportante no ha solicitado atención.</p>
      )}

      <p className="mt-4 flex items-start gap-1.5 border-t border-line pt-3 text-[12px] text-muted">
        <Info size={14} className="mt-0.5 shrink-0" aria-hidden />{NORMATIVE_NOTICE}
      </p>
    </section>
  )
}

function AttentionForm({ incident, isSaving, onSave }: { incident: IncidentDetail; isSaving: boolean; onSave: HumanAttentionFormAsideProps['onSave'] }) {
  const attention = incident.attention!
  const { register, handleSubmit, setValue, setError, formState: { errors } } = useForm<HumanAttentionFormValues>({
    resolver: zodResolver(humanAttentionSchema),
    defaultValues: { acciones: attention.actions ?? '', nota_resolucion: attention.resolutionNote ?? '', cerrar: false },
  })

  const submitWith = (cerrar: boolean) => {
    setValue('cerrar', cerrar)
    return handleSubmit(async (values) => {
      const failure = await onSave({ ...values, cerrar })
      if (failure) applyServerErrors(failure, setError, ['acciones', 'nota_resolucion', 'cerrar'])
    })()
  }
  const area = (hasError: boolean) => cn(inputClassName(hasError), 'py-2')

  return (
    <form noValidate aria-label="Registro de la atención N2" onSubmit={(e) => { e.preventDefault(); void submitWith(false) }} className="space-y-3">
      <p className="text-[12px] text-muted">Atendido por {attention.analyst.name} desde {formatDateTime(attention.startedAt)}</p>
      <FormAlert message={errors.root?.server?.message} />
      <fieldset className="space-y-3">
        <legend className="sr-only">Intervención técnica</legend>
        <Field id="att-acciones" label="Acciones realizadas" error={errors.acciones?.message} help="Qué verificaste o ejecutaste para resolver el caso.">
          <textarea id="att-acciones" rows={4} {...register('acciones')} aria-invalid={!!errors.acciones} className={area(!!errors.acciones)} />
        </Field>
        <Field id="att-nota" label="Nota de resolución" error={errors.nota_resolucion?.message} help="Queda como historial; no alimenta el RAG.">
          <textarea id="att-nota" rows={4} {...register('nota_resolucion')} aria-invalid={!!errors.nota_resolucion} className={area(!!errors.nota_resolucion)} />
        </Field>
      </fieldset>
      <footer className="flex flex-col gap-2">
        <Button type="submit" variant="secondary" icon={<Save size={17} aria-hidden />} disabled={isSaving}>Guardar nota</Button>
        <Button icon={<Archive size={17} aria-hidden />} disabled={isSaving} onClick={() => void submitWith(true)}>Cerrar incidencia</Button>
      </footer>
    </form>
  )
}
