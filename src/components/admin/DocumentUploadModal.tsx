import { useDropzone } from 'react-dropzone'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FileText, Upload, X } from 'lucide-react'
import { Button, Dialog, Field, IconButton } from '@/components/ui'
import FormAlert from '@/components/forms/FormAlert'
import { applyServerErrors } from '@/components/forms/applyServerErrors'
import { formatSize } from '@/lib/format'
import { DOCUMENT_PURPOSE_LABEL } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { SubmitResult } from '@/lib/apiErrors'
import { documentUploadSchema, MAX_PDF_SIZE_BYTES, type DocumentUploadFormValues } from '@/schemas/document.schema'
import { fieldClassName, inputClassName } from '@/styles/tokens.form'

export interface DocumentUploadSeed {
  codigo: string
  titulo: string
  descripcion?: string
  finalidad: DocumentUploadFormValues['finalidad']
}

interface DocumentUploadModalProps {
  open: boolean
  /** Precarga para "Nueva versión" de un documento existente (DOCUMENTO.codigo se reutiliza). */
  seed: DocumentUploadSeed | null
  isUploading: boolean
  onClose: () => void
  onSubmit: (values: DocumentUploadFormValues) => Promise<SubmitResult>
}

const FIELDS = ['codigo', 'titulo', 'descripcion', 'version', 'finalidad', 'archivo'] as const

/** Carga de una nueva VERSION_DOCUMENTO (PDF ≤ 25 MB) con zona de arrastre. */
export default function DocumentUploadModal({ open, seed, isUploading, onClose, onSubmit }: DocumentUploadModalProps) {
  return (
    <Dialog open={open} onClose={onClose} title={seed ? 'Cargar nueva versión' : 'Cargar PDF normativo'} sub={seed ? 'La versión anterior y sus citas se conservan.' : undefined} wide>
      {open && <UploadForm seed={seed} isUploading={isUploading} onCancel={onClose} onSubmit={onSubmit} />}
    </Dialog>
  )
}

function UploadForm({ seed, isUploading, onCancel, onSubmit }: { seed: DocumentUploadSeed | null; isUploading: boolean; onCancel: () => void; onSubmit: DocumentUploadModalProps['onSubmit'] }) {
  const { register, control, handleSubmit, setError, formState: { errors } } = useForm<DocumentUploadFormValues>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: { codigo: seed?.codigo ?? '', titulo: seed?.titulo ?? '', descripcion: seed?.descripcion ?? '', version: '', finalidad: seed?.finalidad ?? 'AMBAS' },
  })

  const submit = handleSubmit(async (values) => {
    const failure = await onSubmit(values)
    if (failure) applyServerErrors(failure, setError, FIELDS)
    else onCancel()
  })

  const input = (hasError: boolean) => cn(inputClassName(hasError), 'h-11 md:h-10')

  return (
    <form onSubmit={submit} noValidate aria-label="Carga de documento PDF" className="space-y-4">
      <FormAlert message={errors.root?.server?.message} />
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="sr-only">Datos del documento</legend>
        <Field id="doc-codigo" label="Código" error={errors.codigo?.message} help="Ej. POL-SGSI-01">
          <input id="doc-codigo" {...register('codigo')} readOnly={!!seed} aria-invalid={!!errors.codigo} className={cn(input(!!errors.codigo), seed && 'bg-canvas')} />
        </Field>
        <Field id="doc-version" label="Versión" error={errors.version?.message} help="Ej. v2.1">
          <input id="doc-version" {...register('version')} aria-invalid={!!errors.version} className={input(!!errors.version)} />
        </Field>
        <Field id="doc-titulo" label="Título" error={errors.titulo?.message}>
          <input id="doc-titulo" {...register('titulo')} aria-invalid={!!errors.titulo} className={input(!!errors.titulo)} />
        </Field>
        <Field id="doc-finalidad" label="Finalidad" error={errors.finalidad?.message} help="Define qué rama de IA puede citarlo.">
          <select id="doc-finalidad" {...register('finalidad')} className={input(!!errors.finalidad)}>
            {(Object.keys(DOCUMENT_PURPOSE_LABEL) as (keyof typeof DOCUMENT_PURPOSE_LABEL)[]).map((k) => <option key={k} value={k}>{DOCUMENT_PURPOSE_LABEL[k]}</option>)}
          </select>
        </Field>
      </fieldset>
      <Field id="doc-descripcion" label="Descripción" optional error={errors.descripcion?.message}>
        <textarea id="doc-descripcion" rows={2} {...register('descripcion')} className={cn(inputClassName(!!errors.descripcion), 'py-2')} />
      </Field>
      <Controller control={control} name="archivo" render={({ field }) => (
        <PdfDropzone file={field.value ?? null} error={errors.archivo?.message} onChange={field.onChange} />
      )} />
      <p className="text-xs text-muted">Las instrucciones contenidas en el documento nunca se tratan como órdenes para la IA.</p>
      <footer className={fieldClassName.footer}>
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" icon={<Upload size={18} aria-hidden />} disabled={isUploading}>{isUploading ? 'Cargando…' : 'Cargar PDF'}</Button>
      </footer>
    </form>
  )
}

function PdfDropzone({ file, error, onChange }: { file: File | null; error?: string; onChange: (file: File | undefined) => void }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    multiple: false,
    // El tamaño se valida con Zod para mostrar el mensaje del contrato; aquí solo se descartan tipos.
    onDrop: (accepted, rejected) => onChange(accepted[0] ?? (rejected[0]?.file as File | undefined)),
  })

  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-semibold">Archivo PDF</legend>
      {file ? (
        <p className={cn('flex items-center gap-3 rounded-tile border p-3', error ? 'border-2 border-deep bg-soft' : 'border-line bg-soft')}>
          <FileText size={20} className="shrink-0 text-primary" aria-hidden />
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{file.name}</span><span className="block text-xs text-muted">{formatSize(file.size)}</span></span>
          <IconButton label="Quitar archivo" onClick={() => onChange(undefined)}><X size={18} aria-hidden /></IconButton>
        </p>
      ) : (
        <section {...getRootProps({ 'aria-label': 'Zona para arrastrar o seleccionar un PDF' })}
          className={cn('flex cursor-pointer flex-col items-center rounded-card border-2 border-dashed px-4 py-8 text-center transition-colors',
            isDragActive ? 'border-primary bg-soft' : error ? 'border-deep bg-soft' : 'border-mid hover:border-primary hover:bg-soft')}>
          <input {...getInputProps()} />
          <Upload size={24} className="mb-2 text-primary" aria-hidden />
          <span className="text-base font-semibold">{isDragActive ? 'Suelta el PDF aquí' : 'Arrastra un PDF o haz clic para seleccionarlo'}</span>
          <span className="mt-1 text-xs text-muted">Máximo {MAX_PDF_SIZE_BYTES / (1024 * 1024)} MB</span>
        </section>
      )}
      {error && <p id="doc-archivo-err" role="alert" className="mt-1 text-xs font-medium text-deep">{error}</p>}
    </fieldset>
  )
}
