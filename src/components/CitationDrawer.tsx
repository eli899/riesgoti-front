import { useEffect, useRef } from 'react'
import { BookOpen, Lock, X } from 'lucide-react'
import { IconButton, MarkdownViewer } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { Citation } from '@/types/domain.types'

interface CitationDrawerProps {
  isOpen: boolean
  citation: Citation | null
  onClose: () => void
}

function formatPages(start: number | null, end: number | null) {
  if (start === null) return 'Página no determinada'
  return end === null || end === start ? `Pág. ${start}` : `Págs. ${start} - ${end}`
}

/** Panel lateral de inspección de una cita normativa (FRAGMENTO_DOCUMENTO). Componente presentacional puro. */
export default function CitationDrawer({ isOpen, citation, onClose }: CitationDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const visible = isOpen && citation !== null

  return (
    <aside
      role="complementary"
      aria-label="Inspección de fuente documental citada"
      aria-hidden={!visible}
      inert={!visible}
      className={cn(
        'fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-line bg-white shadow-card transition-transform duration-200 md:max-w-lg',
        visible ? 'translate-x-0' : 'pointer-events-none translate-x-full',
      )}
    >
      {citation && (
        <>
          <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
            <hgroup className="min-w-0">
              <h2 className="text-[16px] font-bold">
                Cita [{citation.number}] — {citation.documentCode} ({citation.documentVersion})
              </h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted">
                <BookOpen size={14} className="shrink-0 text-primary" aria-hidden />
                <span className="truncate">{citation.documentTitle}</span>
              </p>
            </hgroup>
            <IconButton ref={closeRef} label="Cerrar panel de cita normativa" onClick={onClose} className="-mr-2 -mt-1">
              <X size={20} aria-hidden />
            </IconButton>
          </header>

          <article aria-labelledby="citation-trace" className="flex-1 overflow-y-auto px-5 py-4">
            <dl id="citation-trace" className="mb-4 grid grid-cols-2 gap-x-4 gap-y-1 rounded-[12px] bg-soft p-3 text-[12px]">
              <dt className="font-medium text-muted">Ubicación</dt>
              <dd className="font-mono text-primary-pressed">{formatPages(citation.pageStart, citation.pageEnd)}</dd>
              <dt className="font-medium text-muted">Fragmento</dt>
              <dd className="font-mono text-primary-pressed">#{citation.fragmentId}</dd>
              {citation.documentActive !== null && (
                <>
                  <dt className="font-medium text-muted">Versión documental</dt>
                  <dd>{citation.documentActive ? 'Vigente' : 'Desactivada (consulta histórica)'}</dd>
                </>
              )}
            </dl>
            <MarkdownViewer content={citation.content} />
          </article>

          <footer className="flex items-start gap-2 border-t border-line px-5 py-3 text-[12px] text-muted">
            <Lock size={14} className="mt-0.5 shrink-0" aria-hidden />
            <p>Fragmento preservado de forma inmutable: desactivar la versión documental no altera las citas históricas (INV-04).</p>
          </footer>
        </>
      )}
    </aside>
  )
}
