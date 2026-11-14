import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Upload } from 'lucide-react'
import { Button, Dialog } from '@/components/ui'
import FormAlert from '@/components/forms/FormAlert'
import { applyServerErrors } from '@/components/forms/applyServerErrors'
import { PdfDropzone } from '@/components/admin/DocumentUploadModal'
import type { SubmitResult } from '@/lib/apiErrors'
import { documentReplaceFileSchema, type DocumentReplaceFileFormValues } from '@/schemas/document.schema'
import { fieldClassName } from '@/styles/tokens.form'
import type { DocumentVersion } from '@/types/domain.types'

interface DocumentReplaceFileModalProps {
  /** Versión en ERROR cuyo PDF se reemplaza; null cierra el diálogo. */
  version: DocumentVersion | null
  isReplacing: boolean
  onClose: () => void
  onSubmit: (id: number, values: DocumentReplaceFileFormValues) => Promise<SubmitResult>
}

const FIELDS = ['archivo'] as const

/** Nueva carga del PDF de una VERSION_DOCUMENTO en ERROR: conserva código, título, finalidad y número de versión. */
export default function DocumentReplaceFileModal({ version, isReplacing, onClose, onSubmit }: DocumentReplaceFileModalProps) {
  return (
    <Dialog open={version !== null} onClose={onClose} title="Cargar nuevamente el PDF" sub={version ? `${version.code} · versión ${version.version}` : undefined} wide>
      {version && <ReplaceForm key={version.id} version={version} isReplacing={isReplacing} onCancel={onClose} onSubmit={onSubmit} />}
    </Dialog>
  )
}

function ReplaceForm({ version, isReplacing, onCancel, onSubmit }: { version: DocumentVersion; isReplacing: boolean; onCancel: () => void; onSubmit: DocumentReplaceFileModalProps['onSubmit'] }) {
  const { control, handleSubmit, setError, formState: { errors } } = useForm<DocumentReplaceFileFormValues>({
    resolver: zodResolver(documentReplaceFileSchema),
  })

  const submit = handleSubmit(async (values) => {
    const failure = await onSubmit(version.id, values)
    if (failure) applyServerErrors(failure, setError, FIELDS)
    else onCancel()
  })

  return (
    <form onSubmit={submit} noValidate aria-label={`Nueva carga del PDF de ${version.code}`} className="space-y-4">
      <FormAlert message={errors.root?.server?.message} />
      {version.processingError && (
        <section aria-label="Motivo del error anterior" className="rounded-control bg-soft p-3 text-xs text-deep">
          <h3 className="mb-1 font-semibold">Error del procesamiento anterior</h3>
          <p>{version.processingError}</p>
        </section>
      )}
      <p className="text-sm text-muted">
        El nuevo PDF reemplaza al anterior y se procesa otra vez. Asegúrate de que tenga texto seleccionable: si al abrirlo no puedes copiar el texto, el sistema no podrá leerlo.
      </p>
      <Controller control={control} name="archivo" render={({ field }) => (
        <PdfDropzone file={field.value ?? null} error={errors.archivo?.message} onChange={field.onChange} />
      )} />
      <footer className={fieldClassName.footer}>
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" icon={<Upload size={18} aria-hidden />} disabled={isReplacing}>{isReplacing ? 'Cargando…' : 'Cargar nuevamente'}</Button>
      </footer>
    </form>
  )
}
