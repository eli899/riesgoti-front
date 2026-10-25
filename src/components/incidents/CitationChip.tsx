import { BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Citation } from '@/types/domain.types'

const citationPages = (c: Citation) =>
  c.pageStart === null ? '' : c.pageEnd === null || c.pageEnd === c.pageStart ? `Pág. ${c.pageStart}` : `Págs. ${c.pageStart}-${c.pageEnd}`

/** Referencia normativa [n] interactiva: abre el panel de inspección del fragmento citado. */
export default function CitationChip({ citation, onInspect, compact = false }: { citation: Citation; onInspect: (c: Citation) => void; compact?: boolean }) {
  const pages = citationPages(citation)
  return (
    <button
      type="button"
      onClick={() => onInspect(citation)}
      aria-label={`Ver cita ${citation.number}: ${citation.documentCode} ${citation.documentVersion}${pages ? `, ${pages}` : ''}`}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-mid bg-soft font-semibold text-primary-pressed align-baseline transition-colors hover:border-primary hover:bg-line',
        compact ? 'mx-0.5 px-1.5 py-px text-2xs' : 'px-2.5 py-1 text-xs',
      )}
    >
      {!compact && <BookOpen size={13} aria-hidden />}
      <span className="font-mono">[{citation.number}]</span>
      {!compact && <span>{citation.documentCode}{pages && ` · ${pages}`}</span>}
    </button>
  )
}

/** Divide un texto con marcas [n] e intercala chips para las citas existentes. */
export function TextWithCitations({ text, citations, onInspect }: { text: string; citations: Citation[]; onInspect: (c: Citation) => void }) {
  const parts = text.split(/(\[\d+\])/g)
  return (
    <>
      {parts.map((part, i) => {
        const match = /^\[(\d+)\]$/.exec(part)
        const citation = match ? citations.find((c) => c.number === Number(match[1])) : undefined
        return citation ? <CitationChip key={i} citation={citation} onInspect={onInspect} compact /> : <span key={i}>{part}</span>
      })}
    </>
  )
}
