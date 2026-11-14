import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Activity, AlertTriangle, Bot, Boxes, Lock, Pencil, Save, SlidersHorizontal } from 'lucide-react'
import { Button, Field } from '@/components/ui'
import { applyServerErrors } from '@/components/forms/applyServerErrors'
import FormAlert from '@/components/forms/FormAlert'
import { cn } from '@/lib/utils'
import type { SubmitResult } from '@/lib/apiErrors'
import { aiConfigFormSchema, type AIConfigFormValues } from '@/schemas/aiConfig.schema'
import { inputClassName } from '@/styles/tokens.form'
import { cardClassName } from '@/styles/tokens.layout'
import { EMBEDDING_PROVIDER, LLM_PROVIDER } from '@/constants/domain.constants'
import { EMBEDDING_PROVIDER_LABEL, LLM_PROVIDER_LABEL } from '@/constants/labels.constants'

// Orden de presentación de los proveedores en los selectores.
const LLM_PROVIDERS = [LLM_PROVIDER.GEMINI, LLM_PROVIDER.OPENAI, LLM_PROVIDER.HUGGINGFACE_LOCAL].map((id) => ({ id, label: LLM_PROVIDER_LABEL[id] }))
const EMBEDDING_PROVIDERS = [EMBEDDING_PROVIDER.SENTENCE_TRANSFORMERS, EMBEDDING_PROVIDER.GEMINI, EMBEDDING_PROVIDER.OPENAI].map((id) => ({ id, label: EMBEDDING_PROVIDER_LABEL[id] }))

interface AIConfigFormViewProps {
  defaultValues: AIConfigFormValues
  llmKeyMask: string | null
  embeddingKeyMask: string | null
  isSaving: boolean
  isTesting: boolean
  onSubmit: (values: AIConfigFormValues) => Promise<SubmitResult>
  onTestConnection: (values: AIConfigFormValues) => void
  /** Primera configuración (no existe ninguna publicada): se puede publicar sin modificar los valores sugeridos. */
  isInitial?: boolean
}

/** Tarjeta de un grupo del formulario: <fieldset> cuyo <legend> conserva el nombre accesible del grupo. */
function ConfigSection({ legend, description, icon, children }: { legend: string; description: string; icon: ReactNode; children: ReactNode }) {
  return (
    <fieldset className={cn(cardClassName.base, 'min-w-0')}>
      <legend className="sr-only">{legend}</legend>
      <header className="flex items-start gap-3 border-b border-line px-4 py-3 md:px-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-tile bg-soft text-primary" aria-hidden>{icon}</span>
        <span>
          <h2 className="text-md font-semibold">{legend}</h2>
          <p className="text-xs text-muted">{description}</p>
        </span>
      </header>
      <section className="divide-y divide-line">{children}</section>
    </fieldset>
  )
}

/** Subgrupo dentro de una tarjeta, con su rótulo y una rejilla de campos. */
function ConfigSubsection({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className="px-4 py-4 md:px-5" aria-label={title}>
      <h3 className="mb-3 text-2xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      <section className={cn('grid gap-4 md:grid-cols-2', className)}>{children}</section>
    </section>
  )
}

/** Indicador del estado de una credencial cifrada (solo se muestra la máscara). */
function KeyStatus({ mask, emptyText }: { mask: string | null; emptyText: string }) {
  return (
    <span className={cn('mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', mask ? 'bg-soft text-primary-pressed' : 'bg-disabled text-muted')}>
      <Lock size={12} aria-hidden />
      {mask ? <>Clave cifrada vigente <span className="font-mono">{mask}</span></> : emptyText}
    </span>
  )
}

/** Control con unidad visible a la derecha (tokens, fragmentos, rango). */
function WithUnit({ unit, children }: { unit: string; children: ReactNode }) {
  return (
    <span className="relative block">
      {children}
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted" aria-hidden>{unit}</span>
    </span>
  )
}

/** Formulario de CONFIGURACION_IA_RAG. Las API keys nunca se precargan: vacías conservan la clave cifrada vigente. */
export default function AIConfigFormView({ defaultValues, llmKeyMask, embeddingKeyMask, isSaving, isTesting, onSubmit, onTestConnection, isInitial = false }: AIConfigFormViewProps) {
  const form = useForm<AIConfigFormValues>({ resolver: zodResolver(aiConfigFormSchema), defaultValues, mode: 'onChange' })
  const { register, handleSubmit, formState: { errors, isDirty }, getValues, reset, setError } = form

  const submit = handleSubmit(async (values) => {
    const failure = await onSubmit(values)
    if (failure) applyServerErrors(failure, setError, Object.keys(values))
    else reset({ ...values, api_key_llm: '', api_key_embedding: '' })
  })

  const input = (hasError: boolean, extra: string = 'h-11 md:h-10') => cn(inputClassName(hasError), extra)
  const numeric = (hasError: boolean) => input(hasError, 'h-11 pr-24 md:h-10')
  const describedBy = (id: string, hasError: boolean) => (hasError ? `${id}-err` : `${id}-help`)

  return (
    <form onSubmit={submit} noValidate className="space-y-5" aria-label="Configuración IA/RAG">
      <FormAlert message={errors.root?.server?.message} />

      <ConfigSection legend="Modelo de lenguaje (LLM)" description="Genera la orientación operativa y el análisis estratégico de cada incidencia." icon={<Bot size={18} />}>
        <ConfigSubsection title="Proveedor y modelo">
          <Field id="proveedor_llm" required label="Proveedor" error={errors.proveedor_llm?.message}>
            <select id="proveedor_llm" {...register('proveedor_llm')} className={input(!!errors.proveedor_llm)}>
              {LLM_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </Field>
          <Field id="modelo_llm" required label="Modelo" error={errors.modelo_llm?.message} help="Ej. gemini-2.5-flash, gpt-4o-mini">
            <input id="modelo_llm" {...register('modelo_llm')} aria-invalid={!!errors.modelo_llm} aria-describedby={describedBy('modelo_llm', !!errors.modelo_llm)} className={cn(input(!!errors.modelo_llm), 'font-mono')} />
          </Field>
        </ConfigSubsection>
        <ConfigSubsection title="Conexión y credenciales">
          <Field id="endpoint_base_llm" label="Endpoint base" optional error={errors.endpoint_base_llm?.message} help="Solo para proveedores autoalojados u OpenAI compatibles.">
            <input id="endpoint_base_llm" type="url" placeholder="https://" {...register('endpoint_base_llm')} aria-invalid={!!errors.endpoint_base_llm} aria-describedby={describedBy('endpoint_base_llm', !!errors.endpoint_base_llm)} className={input(!!errors.endpoint_base_llm)} />
          </Field>
          <Field id="api_key_llm" label="API key del LLM" optional error={errors.api_key_llm?.message} help={llmKeyMask ? 'Déjala vacía para conservar la clave vigente.' : 'Escribe la clave para cifrarla y guardarla.'}>
            <input id="api_key_llm" type="password" autoComplete="new-password" placeholder={llmKeyMask ? 'Nueva clave (opcional)' : 'Sin llave configurada'} {...register('api_key_llm')} aria-describedby={describedBy('api_key_llm', !!errors.api_key_llm)} className={input(!!errors.api_key_llm)} />
            <KeyStatus mask={llmKeyMask} emptyText="Sin llave configurada" />
          </Field>
        </ConfigSubsection>
      </ConfigSection>

      <ConfigSection legend="Embeddings (espacio vectorial FAISS)" description="Convierte los fragmentos documentales en vectores para la búsqueda semántica." icon={<Boxes size={18} />}>
        <ConfigSubsection title="Proveedor y modelo">
          <Field id="proveedor_embedding" required label="Proveedor" error={errors.proveedor_embedding?.message}>
            <select id="proveedor_embedding" {...register('proveedor_embedding')} className={input(!!errors.proveedor_embedding)}>
              {EMBEDDING_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </Field>
          <Field id="modelo_embedding" required label="Modelo de embedding" error={errors.modelo_embedding?.message} help="Nombre exacto del modelo del proveedor.">
            <input id="modelo_embedding" {...register('modelo_embedding')} aria-invalid={!!errors.modelo_embedding} aria-describedby={describedBy('modelo_embedding', !!errors.modelo_embedding)} className={cn(input(!!errors.modelo_embedding), 'font-mono')} />
          </Field>
          <p className="flex items-start gap-2 rounded-control border border-mid bg-soft px-3 py-2 text-xs text-primary-pressed md:col-span-2">
            <AlertTriangle size={14} className="mt-px shrink-0" aria-hidden />
            Cambiar el proveedor o el modelo de embedding exige reindexar los documentos activos; hasta entonces no participan en las búsquedas.
          </p>
        </ConfigSubsection>
        <ConfigSubsection title="Credenciales">
          <Field id="api_key_embedding" label="API key de embeddings" optional error={errors.api_key_embedding?.message} help={embeddingKeyMask ? 'Déjala vacía para conservar la clave vigente.' : 'No requerida para modelos locales.'}>
            <input id="api_key_embedding" type="password" autoComplete="new-password" placeholder={embeddingKeyMask ? 'Nueva clave (opcional)' : 'Sin llave configurada'} {...register('api_key_embedding')} aria-describedby={describedBy('api_key_embedding', !!errors.api_key_embedding)} className={input(!!errors.api_key_embedding)} />
            <KeyStatus mask={embeddingKeyMask} emptyText="Sin llave configurada" />
          </Field>
        </ConfigSubsection>
      </ConfigSection>

      <ConfigSection legend="Parámetros de recuperación RAG" description="Definen cómo se fragmentan los documentos y cuánto contexto recibe el modelo." icon={<SlidersHorizontal size={18} />}>
        <ConfigSubsection title="Fragmentación de documentos">
          <Field id="chunk_size" required label="Tamaño de fragmento" error={errors.chunk_size?.message} help="Entre 256 y 2048.">
            <WithUnit unit="tokens">
              <input id="chunk_size" type="number" inputMode="numeric" min={256} max={2048} {...register('chunk_size', { valueAsNumber: true })} aria-invalid={!!errors.chunk_size} aria-describedby={describedBy('chunk_size', !!errors.chunk_size)} className={numeric(!!errors.chunk_size)} />
            </WithUnit>
          </Field>
          <Field id="chunk_overlap" required label="Solapamiento" error={errors.chunk_overlap?.message} help="Menor a la mitad del tamaño de fragmento.">
            <WithUnit unit="tokens">
              <input id="chunk_overlap" type="number" inputMode="numeric" min={0} max={512} {...register('chunk_overlap', { valueAsNumber: true, deps: ['chunk_size'] })} aria-invalid={!!errors.chunk_overlap} aria-describedby={describedBy('chunk_overlap', !!errors.chunk_overlap)} className={numeric(!!errors.chunk_overlap)} />
            </WithUnit>
          </Field>
        </ConfigSubsection>
        <ConfigSubsection title="Recuperación">
          <Field id="top_k" required label="Fragmentos recuperados (top-k)" error={errors.top_k?.message} help="Entre 1 y 15 por consulta.">
            <WithUnit unit="fragmentos">
              <input id="top_k" type="number" inputMode="numeric" min={1} max={15} {...register('top_k', { valueAsNumber: true })} aria-invalid={!!errors.top_k} aria-describedby={describedBy('top_k', !!errors.top_k)} className={numeric(!!errors.top_k)} />
            </WithUnit>
          </Field>
          <Field id="umbral_similitud" required label="Umbral de similitud" error={errors.umbral_similitud?.message} help="Por debajo de este valor, el caso pasa a atención humana.">
            <WithUnit unit="0.00 – 1.00">
              <input id="umbral_similitud" type="number" inputMode="decimal" step={0.01} min={0} max={1} {...register('umbral_similitud', { valueAsNumber: true })} aria-invalid={!!errors.umbral_similitud} aria-describedby={describedBy('umbral_similitud', !!errors.umbral_similitud)} className={numeric(!!errors.umbral_similitud)} />
            </WithUnit>
          </Field>
        </ConfigSubsection>
      </ConfigSection>

      <footer className="sticky bottom-[max(12px,env(safe-area-inset-bottom))] z-20 flex flex-col gap-3 rounded-card-mobile border border-line bg-white/95 p-3 shadow-card backdrop-blur sm:flex-row sm:items-center sm:justify-between md:rounded-card">
        <p className="flex items-center gap-2 text-sm text-muted" aria-live="polite">
          <Pencil size={16} className="shrink-0 text-primary" aria-hidden />
          {isDirty ? <strong className="font-semibold text-primary-pressed">Cambios sin publicar</strong> : isInitial ? 'Valores sugeridos listos para publicar.' : 'Sin cambios respecto a la versión vigente.'}
        </p>
        <span className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="secondary" icon={<Activity size={18} aria-hidden />} disabled={isTesting} onClick={() => onTestConnection(getValues())}>
            {isTesting ? 'Probando conexión…' : 'Probar conexión'}
          </Button>
          <Button type="submit" icon={<Save size={18} aria-hidden />} disabled={isSaving || (!isDirty && !isInitial)}>
            {isSaving ? 'Publicando…' : isInitial ? 'Publicar configuración inicial' : 'Publicar nueva versión'}
          </Button>
        </span>
      </footer>
    </form>
  )
}
