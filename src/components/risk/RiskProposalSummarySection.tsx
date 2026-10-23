import { ShieldAlert } from 'lucide-react'
import { AIBadge, KV, MarkdownViewer } from '@/components/ui'
import { NOT_DETERMINED } from '@/lib/format'
import type { RiskVersion } from '@/types/domain.types'

/** Contenido de la propuesta (VERSION_RIESGO): descripción, vectores de riesgo y recomendación en Markdown seguro. */
export default function RiskProposalSummarySection({ version }: { version: RiskVersion }) {
  const fields: [string, string | null][] = [
    ['Amenaza', version.threat],
    ['Vulnerabilidad', version.vulnerability],
    ['Consecuencia', version.consequence],
  ]
  return (
    <section aria-labelledby="proposal-heading" className="rounded-[18px] border border-line bg-white p-4 shadow-card md:rounded-[14px] md:p-5">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="proposal-heading" className="flex items-center gap-2 text-[15px] font-semibold"><ShieldAlert size={18} className="text-primary" aria-hidden />Propuesta de riesgo</h2>
        {version.origin === 'IA' && <AIBadge />}
      </header>
      {version.description && <p className="mb-4 text-[14px]">{version.description}</p>}
      <dl className="grid gap-x-4 md:grid-cols-3">
        {fields.map(([k, v]) => <span key={k} className="block min-w-0"><KV k={k} v={v || NOT_DETERMINED} nd={!v} /></span>)}
      </dl>
      <h3 className="mb-1 text-[12px] font-medium text-muted">Recomendación</h3>
      {version.recommendation
        ? <MarkdownViewer content={version.recommendation} className="text-[14px]" />
        : <p className="text-[14px] italic text-control">{NOT_DETERMINED}</p>}
    </section>
  )
}
