import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Activity, Save } from 'lucide-react'
import { Button, Field } from '@/components/ui'
import { applyServerErrors } from '@/components/forms/applyServerErrors'
import FormAlert from '@/components/forms/FormAlert'
import { cn } from '@/lib/utils'
import type { SubmitResult } from '@/lib/apiErrors'
import { aiConfigFormSchema, type AIConfigFormValues } from '@/schemas/aiConfig.schema'
import { inputClassName } from '@/styles/tokens.form'
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
}

/** Formulario de CONFIGURACION_IA_RAG. Las API keys nunca se precargan: vacías conservan la clave cifrada vigente. */
export default function AIConfigFormView({ defaultValues, llmKeyMask, embeddingKeyMask, isSaving, isTesting, onSubmit, onTestConnection }: AIConfigFormViewProps) {
  const form = useForm<AIConfigFormValues>({ resolver: zodResolver(aiConfigFormSchema), defaultValues, mode: 'onChange' })
  const { register, handleSubmit, formState: { errors, isDirty }, getValues, reset, setError } = form

  const submit = handleSubmit(async (values) => {
    const failure = await onSubmit(values)
    if (failure) applyServerErrors(failure, setError, Object.keys(values))
    else reset({ ...values, api_key_llm: '', api_key_embedding: '' })
  })

  const input = (hasError: boolean, extra: string = 'h-11 md:h-10') => cn(inputClassName(hasError), extra)
  const describedBy = (id: string, hasError: boolean) => (hasError ? `${id}-err` : `${id}-help`)

  return (
    <form onSubmit={submit} noValidate className="space-y-5" aria-label="Configuración IA/RAG">
      <FormAlert message={errors.root?.server?.message} />

      <fieldset className="grid gap-4 rounded-card border border-line p-4 md:grid-cols-2 md:p-5">
        <legend className="px-1 text-base font-semibold">Modelo de lenguaje (LLM)</legend>
        <Field id="proveedor_llm" label="Proveedor" error={errors.proveedor_llm?.message}>
          <select id="proveedor_llm" {...register('proveedor_llm')} className={input(!!errors.proveedor_llm)}>
            {LLM_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </Field>
        <Field id="modelo_llm" label="Modelo" error={errors.modelo_llm?.message} help="Ej. gemini-2.5-flash, gpt-4o-mini">
          <input id="modelo_llm" {...register('modelo_llm')} aria-invalid={!!errors.modelo_llm} aria-describedby={describedBy('modelo_llm', !!errors.modelo_llm)} className={input(!!errors.modelo_llm)} />
        </Field>
        <Field id="endpoint_base_llm" label="Endpoint base" optional error={errors.endpoint_base_llm?.message} help="Solo para proveedores autoalojados u OpenAI compatibles.">
          <input id="endpoint_base_llm" type="url" placeholder="https://" {...register('endpoint_base_llm')} aria-invalid={!!errors.endpoint_base_llm} aria-describedby={describedBy('endpoint_base_llm', !!errors.endpoint_base_llm)} className={input(!!errors.endpoint_base_llm)} />
        </Field>
        <Field id="api_key_llm" label="API key del LLM" optional error={errors.api_key_llm?.message} help={llmKeyMask ? `Vigente: ${llmKeyMask}. Déjala vacía para conservarla.` : 'Sin llave configurada.'}>
          <input id="api_key_llm" type="password" autoComplete="new-password" placeholder={llmKeyMask ?? 'Sin llave configurada'} {...register('api_key_llm')} aria-describedby={describedBy('api_key_llm', !!errors.api_key_llm)} className={input(!!errors.api_key_llm)} />
        </Field>
      </fieldset>

      <fieldset className="grid gap-4 rounded-card border border-line p-4 md:grid-cols-2 md:p-5">
        <legend className="px-1 text-base font-semibold">Embeddings (espacio vectorial FAISS)</legend>
        <Field id="proveedor_embedding" label="Proveedor" error={errors.proveedor_embedding?.message}>
          <select id="proveedor_embedding" {...register('proveedor_embedding')} className={input(!!errors.proveedor_embedding)}>
            {EMBEDDING_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </Field>
        <Field id="modelo_embedding" label="Modelo de embedding" error={errors.modelo_embedding?.message} help="Cambiarlo exige reindexar los documentos activos.">
          <input id="modelo_embedding" {...register('modelo_embedding')} aria-invalid={!!errors.modelo_embedding} aria-describedby={describedBy('modelo_embedding', !!errors.modelo_embedding)} className={input(!!errors.modelo_embedding)} />
        </Field>
        <Field id="api_key_embedding" label="API key de embeddings" optional error={errors.api_key_embedding?.message} help={embeddingKeyMask ? `Vigente: ${embeddingKeyMask}. Déjala vacía para conservarla.` : 'No requerida para modelos locales.'}>
          <input id="api_key_embedding" type="password" autoComplete="new-password" placeholder={embeddingKeyMask ?? 'Sin llave configurada'} {...register('api_key_embedding')} aria-describedby={describedBy('api_key_embedding', !!errors.api_key_embedding)} className={input(!!errors.api_key_embedding)} />
        </Field>
      </fieldset>

      <fieldset className="grid gap-4 rounded-card border border-line p-4 sm:grid-cols-2 md:p-5 xl:grid-cols-4">
        <legend className="px-1 text-base font-semibold">Parámetros de recuperación RAG</legend>
        <Field id="chunk_size" label="Tamaño de fragmento" error={errors.chunk_size?.message} help="256 a 2048 tokens.">
          <input id="chunk_size" type="number" inputMode="numeric" min={256} max={2048} {...register('chunk_size', { valueAsNumber: true })} aria-invalid={!!errors.chunk_size} aria-describedby={describedBy('chunk_size', !!errors.chunk_size)} className={input(!!errors.chunk_size)} />
        </Field>
        <Field id="chunk_overlap" label="Solapamiento" error={errors.chunk_overlap?.message} help="Menor a la mitad del tamaño.">
          <input id="chunk_overlap" type="number" inputMode="numeric" min={0} max={512} {...register('chunk_overlap', { valueAsNumber: true, deps: ['chunk_size'] })} aria-invalid={!!errors.chunk_overlap} aria-describedby={describedBy('chunk_overlap', !!errors.chunk_overlap)} className={input(!!errors.chunk_overlap)} />
        </Field>
        <Field id="top_k" label="Fragmentos recuperados (top-k)" error={errors.top_k?.message} help="1 a 15.">
          <input id="top_k" type="number" inputMode="numeric" min={1} max={15} {...register('top_k', { valueAsNumber: true })} aria-invalid={!!errors.top_k} aria-describedby={describedBy('top_k', !!errors.top_k)} className={input(!!errors.top_k)} />
        </Field>
        <Field id="umbral_similitud" label="Umbral de similitud" error={errors.umbral_similitud?.message} help="0.00 a 1.00. Por debajo, el caso pasa a atención humana.">
          <input id="umbral_similitud" type="number" inputMode="decimal" step={0.01} min={0} max={1} {...register('umbral_similitud', { valueAsNumber: true })} aria-invalid={!!errors.umbral_similitud} aria-describedby={describedBy('umbral_similitud', !!errors.umbral_similitud)} className={input(!!errors.umbral_similitud)} />
        </Field>
      </fieldset>

      <footer className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" icon={<Activity size={18} aria-hidden />} disabled={isTesting} onClick={() => onTestConnection(getValues())}>
          {isTesting ? 'Probando conexión…' : 'Probar conexión'}
        </Button>
        <Button type="submit" icon={<Save size={18} aria-hidden />} disabled={isSaving || !isDirty}>
          {isSaving ? 'Publicando…' : 'Publicar nueva versión'}
        </Button>
      </footer>
    </form>
  )
}
