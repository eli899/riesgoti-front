import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Button, Dialog, ErrorState, MarkdownViewer, Skeleton, Tabs } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { DocumentPreview, DocumentVersion } from '@/types/domain.types'
import { DOCUMENT_PROCESSING_STATUS } from '@/constants/domain.constants'

interface DocumentPreviewModalProps {
  version: DocumentVersion | null
  preview: DocumentPreview | null
  isLoading: boolean
  error: string | null
  isAuthorizing: boolean
  onClose: () => void
  onAuthorize: (id: number) => void
}

const pagesLabel = (start: number | null, end: number | null) =>
  start === null ? 'Pág. —' : end === null || end === start ? `Pág. ${start}` : `Págs. ${start}-${end}`

/** Inspección de los FRAGMENTO_DOCUMENTO generados antes de autorizar la versión para el RAG. */
export default function DocumentPreviewModal({ version, preview, isLoading, error, isAuthorizing, onClose, onAuthorize }: DocumentPreviewModalProps) {
  const canAuthorize = version?.processing === DOCUMENT_PROCESSING_STATUS.PENDIENTE_AUTORIZACION
  return (
    <Dialog
      open={version !== null}
      onClose={onClose}
      size="xl"
      bodyClassName="p-0"
      title={version ? `${version.code} · ${version.version}` : ''}
      sub={version ? `${version.title} · ${preview?.fragmentCount ?? version.fragmentCount} fragmentos` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          {canAuthorize && version && (
            <Button icon={<ShieldCheck size={18} aria-hidden />} disabled={isAuthorizing || !preview} onClick={() => onAuthorize(version.id)}>
              {isAuthorizing ? 'Autorizando…' : 'Autorizar y activar versión'}
            </Button>
          )}
        </>
      }
    >
      {error ? (
        <section className="p-5"><ErrorState title="No se pudo cargar la previsualización" text={error} /></section>
      ) : isLoading || !preview ? (
        <section className="space-y-2 p-5" aria-busy="true" aria-label="Cargando fragmentos"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-40" /></section>
      ) : preview.fragments.length === 0 ? (
        <p className="p-5 text-sm text-muted">La versión no generó fragmentos.</p>
      ) : (
        <FragmentBrowser key={preview.id} preview={preview} />
      )}
    </Dialog>
  )
}

function FragmentBrowser({ preview }: { preview: DocumentPreview }) {
  const [selectedId, setSelectedId] = useState(preview.fragments[0].id)
  const [tab, setTab] = useState<'rendered' | 'raw'>('rendered')
  const selected = preview.fragments.find((f) => f.id === selectedId) ?? preview.fragments[0]

  return (
    <section className="flex min-h-[60vh] flex-col md:flex-row">
      <aside aria-label="Fragmentos de la versión" className="max-h-48 shrink-0 overflow-y-auto border-b border-line md:max-h-none md:w-72 md:border-b-0 md:border-r">
        <ol className="p-2">
          {preview.fragments.map((f) => (
            <li key={f.id}>
              <button type="button" aria-current={f.id === selected.id ? 'true' : undefined} onClick={() => setSelectedId(f.id)}
                className={cn('flex w-full items-center justify-between gap-2 rounded-control px-3 py-2 text-left text-sm transition-colors',
                  f.id === selected.id ? 'bg-soft font-semibold text-primary-pressed' : 'text-muted hover:bg-canvas hover:text-ink')}>
                <span>Fragmento #{f.order}</span>
                <span className="rounded-full bg-white px-2 py-0.5 font-mono text-2xs text-primary-pressed">{pagesLabel(f.pageStart, f.pageEnd)}</span>
              </button>
            </li>
          ))}
        </ol>
      </aside>
      <article aria-label={`Fragmento ${selected.order}`} className="min-w-0 flex-1 overflow-y-auto px-5 pt-3">
        <Tabs label="Modo de visualización" value={tab} onChange={setTab} tabs={[{ id: 'rendered', label: 'Vista renderizada' }, { id: 'raw', label: 'Markdown crudo' }]} />
        {tab === 'rendered' ? (
          <MarkdownViewer content={selected.content} className="pb-5" />
        ) : (
          <pre className="mb-5 overflow-x-auto whitespace-pre-wrap rounded-control bg-canvas p-3 font-mono text-xs">{selected.content}</pre>
        )}
      </article>
    </section>
  )
}
