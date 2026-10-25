import { AlertTriangle, BookOpen, Lock } from 'lucide-react'
import { Button, Card, SectionTitle } from '@/components/ui'
import type { Citation } from '@/types/domain.types'

const pages = (c: Citation) => (c.pageStart === null ? 'Página no determinada' : c.pageEnd === null || c.pageEnd === c.pageStart ? `Pág. ${c.pageStart}` : `Págs. ${c.pageStart} - ${c.pageEnd}`)

/** Fuentes normativas estratégicas citadas por la propuesta (CITA_VERSION_RIESGO -> FRAGMENTO_DOCUMENTO). */
export default function StrategicSourcesAside({ citations, onInspect }: { citations: Citation[]; onInspect: (citation: Citation) => void }) {
  return (
    <Card as="aside" aria-labelledby="sources-heading" className="p-4">
      <SectionTitle id="sources-heading" icon={<BookOpen size={18} className="text-primary" aria-hidden />} className="mb-3">Fuentes estratégicas ({citations.length})</SectionTitle>
      {citations.length ? (
        <ol className="space-y-2">
          {citations.map((c) => (
            <li key={`${c.number}-${c.fragmentId}`} className="flex items-start gap-3 rounded-tile border border-line p-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary font-mono text-xs text-white" aria-hidden>{c.number}</span>
              <p className="min-w-0 flex-1 text-xs">
                <span className="block truncate text-sm font-semibold" title={c.documentTitle}>{c.documentTitle}</span>
                <span className="block text-muted"><span className="font-mono">{c.documentCode}</span> {c.documentVersion} · {pages(c)}</span>
                {c.documentActive === false && <span className="mt-1 inline-flex items-center gap-1 text-muted"><Lock size={12} aria-hidden />Versión inactiva: la cita histórica se conserva</span>}
                <Button size="sm" variant="secondary" className="mt-2" onClick={() => onInspect(c)} aria-label={`Consultar fuente ${c.number}: ${c.documentCode}, ${pages(c)}`}>Consultar fuente</Button>
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="flex gap-2 rounded-tile border border-dashed border-control bg-canvas p-3 text-xs text-muted">
          <AlertTriangle size={16} className="shrink-0" aria-hidden />
          No se encontró respaldo documental estratégico. Validar esta propuesta exigirá justificar la decisión sin fuentes.
        </p>
      )}
      <p className="mt-3 text-2xs text-muted">Las fuentes apoyan la recomendación, pero no reemplazan la validación humana.</p>
    </Card>
  )
}
