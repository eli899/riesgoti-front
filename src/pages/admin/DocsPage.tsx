import { useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import AsyncContent from '@/components/AsyncContent'
import DocumentPreviewModal from '@/components/admin/DocumentPreviewModal'
import DocumentUploadModal, { type DocumentUploadSeed } from '@/components/admin/DocumentUploadModal'
import DocumentVersionsTable from '@/components/admin/DocumentVersionsTable'
import PageMeta from '@/components/seo/PageMeta'
import { Button, PageHeader } from '@/components/ui'
import { useDocumentPreview, useKnowledgeBaseManager } from '@/hooks/admin/useKnowledgeBaseManager'
import type { DocumentVersion } from '@/types/domain.types'

/** Sub-vista: base de conocimiento documental (DOCUMENTO / VERSION_DOCUMENTO / FRAGMENTO_DOCUMENTO). */
export default function DocsPage() {
  const kb = useKnowledgeBaseManager()
  const [upload, setUpload] = useState<{ seed: DocumentUploadSeed | null } | null>(null)
  const [previewId, setPreviewId] = useState<number | null>(null)
  const preview = useDocumentPreview(previewId)
  // Se busca en la lista viva para reflejar el nuevo estado tras autorizar (polling / invalidación).
  const previewVersion = kb.versions.find((v) => v.id === previewId) ?? null

  const openNewVersion = (v: DocumentVersion) =>
    setUpload({ seed: { codigo: v.code, titulo: v.title, descripcion: v.description ?? '', finalidad: v.purpose } })

  const authorize = async (id: number) => {
    if (await kb.runAction(id, 'authorize')) setPreviewId(null)
  }

  return (
    <>
      <PageMeta title="Documentos — Administración" description="Carga, procesamiento, previsualización y autorización de los PDFs normativos que alimentan el RAG de RiesgoTI." />
      <main id="main-content" className="page-in">
        <PageHeader
          title="Documentos"
          sub="Solo las versiones procesadas, autorizadas y activas participan en nuevas consultas RAG."
          actions={<Button icon={<Upload size={18} aria-hidden />} onClick={() => setUpload({ seed: null })}>Cargar PDF</Button>}
        />
        {kb.isPolling && (
          <p role="status" className="mb-4 inline-flex items-center gap-2 rounded-full bg-soft px-3 py-1.5 text-xs font-medium text-primary">
            <Loader2 size={14} className="animate-spin" aria-hidden />Actualizando el estado cada 3 segundos mientras haya PDFs en procesamiento
          </p>
        )}
        <section aria-label="Versiones documentales">
          <AsyncContent isLoading={kb.isLoading} error={kb.loadError} onRetry={kb.retryLoad} label="los documentos">
            <DocumentVersionsTable
              versions={kb.versions}
              pendingAction={kb.pendingAction}
              onPreview={(v) => setPreviewId(v.id)}
              onAction={kb.runAction}
              onNewVersion={openNewVersion}
            />
          </AsyncContent>
        </section>
      </main>

      <DocumentUploadModal open={upload !== null} seed={upload?.seed ?? null} isUploading={kb.isUploading} onClose={() => setUpload(null)} onSubmit={kb.uploadVersion} />
      <DocumentPreviewModal
        version={previewVersion}
        preview={preview.preview}
        isLoading={preview.isLoading}
        error={preview.error}
        isAuthorizing={kb.pendingAction?.id === previewId && kb.pendingAction?.action === 'authorize'}
        onClose={() => setPreviewId(null)}
        onAuthorize={authorize}
      />
    </>
  )
}
