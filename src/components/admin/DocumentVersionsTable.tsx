import { useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Clock, Eye, FilePlus2, FileText, Loader2, Power, RefreshCw, RotateCw, Search, ShieldCheck } from 'lucide-react'
import { Button, Card, EmptyState } from '@/components/ui'
import { formatDateTime } from '@/lib/format'
import { DOCUMENT_PURPOSE_LABEL } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { DocumentAction } from '@/hooks/admin/useKnowledgeBaseManager'
import { inputClassName } from '@/styles/tokens.form'
import type { DocumentVersion } from '@/types/domain.types'

type LifecycleState = 'PROCESANDO' | 'ERROR' | 'PENDIENTE_AUTORIZACION' | 'DISPONIBLE' | 'INACTIVO'

const lifecycleOf = (v: DocumentVersion): LifecycleState =>
  v.processing === 'AUTORIZADO' ? (v.active ? 'DISPONIBLE' : 'INACTIVO') : v.processing

const LIFECYCLE: Record<LifecycleState, { label: string; icon: ReactNode; className: string }> = {
  PROCESANDO: { label: 'Procesando PDF a Markdown…', icon: <Loader2 size={14} className="animate-spin" aria-hidden />, className: 'bg-soft text-primary border border-line' },
  ERROR: { label: 'Error de procesamiento', icon: <AlertTriangle size={14} aria-hidden />, className: 'border-2 border-deep bg-soft text-deep' },
  PENDIENTE_AUTORIZACION: { label: 'Pendiente de autorización', icon: <Clock size={14} aria-hidden />, className: 'border border-dashed border-control bg-disabled text-muted' },
  DISPONIBLE: { label: 'Disponible en RAG', icon: <CheckCircle2 size={14} aria-hidden />, className: 'bg-primary text-white' },
  INACTIVO: { label: 'Autorizado · inactivo', icon: <Power size={14} aria-hidden />, className: 'border border-control bg-white text-muted' },
}

interface DocumentVersionsTableProps {
  versions: DocumentVersion[]
  pendingAction: { id: number; action: DocumentAction } | null
  onPreview: (version: DocumentVersion) => void
  onAction: (id: number, action: DocumentAction) => void
  onNewVersion: (version: DocumentVersion) => void
}

/** Ciclo de vida de VERSION_DOCUMENTO: estado de procesamiento, autorización y activación con sus acciones. */
export default function DocumentVersionsTable({ versions, pendingAction, onPreview, onAction, onNewVersion }: DocumentVersionsTableProps) {
  const [query, setQuery] = useState('')
  const term = query.trim().toLowerCase()
  const visible = term
    ? versions.filter((v) => `${v.code} ${v.title} ${v.version}`.toLowerCase().includes(term))
    : versions

  const busy = (id: number, action: DocumentAction) => pendingAction?.id === id && pendingAction.action === action

  return (
    <>
      <p className="relative mb-4 max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-control" aria-hidden />
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar documentos por código, título o versión"
          placeholder="Buscar por código, título o versión" className={cn(inputClassName(), 'h-10 pl-10')} />
      </p>

      {visible.length === 0 ? (
        <Card><EmptyState title="Sin documentos" text={term ? 'Ningún documento coincide con la búsqueda.' : 'Carga el primer PDF normativo para alimentar la base de conocimiento.'} icon={<FileText size={22} />} /></Card>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Versiones documentales">
          {visible.map((v) => {
            const state = lifecycleOf(v)
            const meta = LIFECYCLE[state]
            return (
              <li key={v.id}>
                <Card as="article" aria-labelledby={`doc-${v.id}-title`} className="flex h-full flex-col p-4">
                  <header className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-control bg-soft text-primary" aria-hidden><FileText size={20} /></span>
                    <hgroup className="min-w-0">
                      <h3 id={`doc-${v.id}-title`} className="font-semibold leading-snug">{v.title}</h3>
                      <p className="text-xs text-muted"><span className="font-mono text-primary-pressed">{v.code}</span> · versión {v.version}</p>
                    </hgroup>
                  </header>

                  <p aria-live="polite" className="mt-3">
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', meta.className)}>{meta.icon}{meta.label}</span>
                  </p>

                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    <dt className="text-muted">Finalidad</dt><dd className="font-medium">{DOCUMENT_PURPOSE_LABEL[v.purpose]}</dd>
                    <dt className="text-muted">Fragmentos</dt><dd className="font-medium">{v.fragmentCount}</dd>
                    <dt className="text-muted">Cargado</dt><dd className="font-medium">{formatDateTime(v.uploadedAt)} · {v.uploadedBy.name}</dd>
                    {v.authorizedBy && <><dt className="text-muted">Autorizado por</dt><dd className="font-medium">{v.authorizedBy.name}</dd></>}
                  </dl>

                  {state === 'ERROR' && v.processingError && <p role="alert" className="mt-3 rounded-control bg-soft p-2 text-xs text-deep">{v.processingError}</p>}
                  {state === 'INACTIVO' && <p className="mt-3 text-xs text-muted">Las citas históricas en incidencias y riesgos se conservan.</p>}
                  {v.requiresReindex && (
                    <p className="mt-3 flex items-start gap-1.5 text-xs font-medium text-deep">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />Indexado con otro modelo de embedding ({v.embeddingModel ?? 'desconocido'}).
                    </p>
                  )}

                  <footer className="mt-auto flex flex-wrap gap-2 pt-4">
                    {state === 'ERROR' && (
                      <Button size="sm" variant="danger" icon={<RotateCw size={15} aria-hidden />} disabled={busy(v.id, 'retry')} onClick={() => onAction(v.id, 'retry')}>Reintentar</Button>
                    )}
                    {state === 'PENDIENTE_AUTORIZACION' && (
                      <Button size="sm" icon={<ShieldCheck size={15} aria-hidden />} onClick={() => onPreview(v)}>Previsualizar y autorizar</Button>
                    )}
                    {state === 'DISPONIBLE' && (
                      <Button size="sm" variant="secondary" icon={<Power size={15} aria-hidden />} disabled={busy(v.id, 'deactivate')} onClick={() => onAction(v.id, 'deactivate')}>Desactivar</Button>
                    )}
                    {state === 'INACTIVO' && (
                      <Button size="sm" icon={<Power size={15} aria-hidden />} disabled={busy(v.id, 'activate')} onClick={() => onAction(v.id, 'activate')}>Activar</Button>
                    )}
                    {v.requiresReindex && (
                      <Button size="sm" variant="secondary" icon={<RefreshCw size={15} aria-hidden />} disabled={busy(v.id, 'reindex')} onClick={() => onAction(v.id, 'reindex')}>Reindexar</Button>
                    )}
                    {(state === 'DISPONIBLE' || state === 'INACTIVO') && (
                      <>
                        <Button size="sm" variant="ghost" icon={<Eye size={15} aria-hidden />} onClick={() => onPreview(v)}>Ver fragmentos</Button>
                        <Button size="sm" variant="ghost" icon={<FilePlus2 size={15} aria-hidden />} onClick={() => onNewVersion(v)}>Nueva versión</Button>
                      </>
                    )}
                  </footer>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
