import { ShieldAlert } from 'lucide-react'
import { AIBadge, Card, KV, MarkdownViewer, SectionTitle } from '@/components/ui'
import { NOT_DETERMINED } from '@/lib/format'
import { cardClassName } from '@/styles/tokens.layout'
import type { RiskVersion } from '@/types/domain.types'

/** Contenido de la propuesta (VERSION_RIESGO): descripción, vectores de riesgo y recomendación en Markdown seguro. */
export default function RiskProposalSummarySection({ version }: { version: RiskVersion }) {
  const fields: [string, string | null][] = [
    ['Amenaza', version.threat],
    ['Vulnerabilidad', version.vulnerability],
    ['Consecuencia', version.consequence],
  ]
  return (
    <Card aria-labelledby="proposal-heading" className={cardClassName.padded}>
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <SectionTitle id="proposal-heading" icon={<ShieldAlert size={18} className="text-primary" aria-hidden />}>Propuesta de riesgo</SectionTitle>
        {version.origin === 'IA' && <AIBadge />}
      </header>
      {version.description && <p className="mb-4 text-base">{version.description}</p>}
      <dl className="grid gap-x-4 md:grid-cols-3">
        {fields.map(([k, v]) => <span key={k} className="block min-w-0"><KV k={k} v={v || NOT_DETERMINED} nd={!v} /></span>)}
      </dl>
      <h3 className="mb-1 text-xs font-medium text-muted">Recomendación</h3>
      {version.recommendation
        ? <MarkdownViewer content={version.recommendation} className="text-base" />
        : <p className="text-base italic text-control">{NOT_DETERMINED}</p>}
    </Card>
  )
}
