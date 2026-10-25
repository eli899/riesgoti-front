import { Lock } from 'lucide-react'
import AsyncContent from '@/components/AsyncContent'
import ProposalCardArticle from '@/components/risk/ProposalCardArticle'
import ProposalsTabsNav from '@/components/risk/ProposalsTabsNav'
import PageMeta from '@/components/seo/PageMeta'
import { EmptyState, PageHeader } from '@/components/ui'
import { PROPOSALS_TABS, useRiskProposalsQueue } from '@/hooks/risks/useRiskProposalsQueue'

const EMPTY_TEXT = {
  nuevas: 'No hay propuestas de la IA con agrupación pendiente de revisión.',
  pendientes_revision: 'No hay propuestas con agrupación confirmada pendientes de decisión.',
  rechazadas: 'No hay versiones de riesgo rechazadas.',
} as const

/** Bandeja de propuestas de riesgo (VERSION_RIESGO) preparadas por la rama estratégica de la IA. */
export default function RiskProposalsQueuePage({ onOpen }: { onOpen: (versionId: number) => void }) {
  const q = useRiskProposalsQueue()
  const tabLabel = PROPOSALS_TABS.find((t) => t.id === q.activeTab)!.label

  return (
    <>
      <PageMeta title="Propuestas de riesgo — RiesgoTI" description="Propuestas de riesgo preparadas por IA a partir de incidencias, pendientes de revisión del analista (ISO/IEC 27005)." />
      <main id="main-content" className="page-in">
        <PageHeader title="Propuestas de riesgo" sub="Preparadas por IA a partir de incidencias. El analista conserva la decisión final." />
        {q.readOnly && (
          <p role="note" className="mb-4 flex items-start gap-2 rounded-tile border border-dashed border-control bg-canvas p-3 text-sm text-muted">
            <Lock size={16} className="mt-0.5 shrink-0" aria-hidden />
            Modo lectura: la revisión, evaluación y validación de riesgos están reservadas al rol Analista (segregación de funciones ISO/IEC 27001).
          </p>
        )}
        <ProposalsTabsNav tabs={q.tabs} value={q.activeTab} onChange={q.setActiveTab} />
        <section aria-labelledby="proposals-list-heading" aria-live="polite">
          <h2 id="proposals-list-heading" className="sr-only">{tabLabel}</h2>
          <AsyncContent isLoading={q.isLoading} error={q.loadError} onRetry={q.retryLoad} label="las propuestas de riesgo">
            {q.proposals.length ? (
              <ul className="space-y-3">
                {q.proposals.map((v) => <li key={v.id}><ProposalCardArticle version={v} onOpen={onOpen} /></li>)}
              </ul>
            ) : (
              <EmptyState title="Sin propuestas" text={EMPTY_TEXT[q.activeTab]} />
            )}
          </AsyncContent>
        </section>
      </main>
    </>
  )
}
