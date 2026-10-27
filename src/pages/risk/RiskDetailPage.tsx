import { useEffect } from 'react'
import { Repeat, ShieldAlert } from 'lucide-react'
import AsyncContent from '@/components/AsyncContent'
import ClusterIncidentsSection from '@/components/risk/ClusterIncidentsSection'
import DecisionReadinessArticle from '@/components/risk/DecisionReadinessArticle'
import RiskProposalSummarySection from '@/components/risk/RiskProposalSummarySection'
import StrategicSourcesAside from '@/components/risk/StrategicSourcesAside'
import VersionHistorySection from '@/components/risk/VersionHistorySection'
import PageMeta from '@/components/seo/PageMeta'
import { BackLink, Button, Card, CriticalityBadge, ErrorState, KV, PageHeader, RiskLevelBadge, ValidationBadge } from '@/components/ui'
import { useRiskVersionCompare } from '@/hooks/risks/useRiskVersionCompare'
import { useCitationDrawer } from '@/hooks/useCitationDrawer'
import { formatDateTime } from '@/lib/format'
import { cardClassName } from '@/styles/tokens.layout'
import { INCIDENT_LINK_STATUS, RISK_VALIDATION_STATUS } from '@/constants/domain.constants'

interface RiskDetailPageProps {
  riskId: number | null
  onBack: () => void
  onOpenWorkspace: (versionId: number) => void
}

/** Detalle de un RIESGO: versión validada vigente (o la más reciente), incidencias, fuentes y comparador de versiones. */
export default function RiskDetailPage({ riskId, onBack, onOpenWorkspace }: RiskDetailPageProps) {
  const d = useRiskVersionCompare(riskId)
  const drawer = useCitationDrawer()
  const { closeDrawer } = drawer
  const shown = d.shown

  useEffect(() => () => {
    closeDrawer()
  }, [closeDrawer])

  const back = <BackLink onClick={onBack}>Registro de riesgos</BackLink>

  if (riskId === null || d.notFound) {
    return (
      <main id="main-content" className="page-in">
        <PageMeta title="Riesgo no encontrado — RiesgoTI" description="El riesgo solicitado no existe." />
        <h1 className="sr-only">Riesgo no encontrado</h1>
        {back}
        <ErrorState title="Riesgo no disponible" text="La referencia no existe." action={<Button variant="secondary" onClick={onBack}>Volver</Button>} />
      </main>
    )
  }

  return (
    <>
      <PageMeta
        title={shown ? `${shown.riskCode}: ${shown.title} — Registro de riesgos` : 'Riesgo — RiesgoTI'}
        description="Versión vigente del riesgo, incidencias relacionadas, fuentes normativas e historial de versiones (ISO/IEC 27005)."
      />
      <main id="main-content" className="page-in">
        {!shown && <h1 className="sr-only">Detalle del riesgo</h1>}
        <AsyncContent isLoading={d.isLoading} error={d.loadError} onRetry={d.retryLoad} label="el riesgo">
          {shown && (
            <>
              <PageHeader
                back={back}
                title={shown.title}
                sub={
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-primary-pressed">{shown.riskCode}</span>· Versión {shown.number}
                    {shown.decision && <span>· {shown.status === RISK_VALIDATION_STATUS.VALIDADA ? 'Validada' : 'Decidida'} el {formatDateTime(shown.decision.decidedAt)}</span>}
                  </span>
                }
                actions={
                  <>
                    <ValidationBadge status={shown.status} />
                    {d.pending && d.canReview && <Button icon={<ShieldAlert size={18} aria-hidden />} onClick={() => onOpenWorkspace(d.pending!.id)}>Revisar propuesta v{d.pending.number}</Button>}
                  </>
                }
              />
              {d.validated && d.pending && (
                <p role="note" className="mb-4 flex items-start gap-2 rounded-tile border border-dashed border-primary bg-soft p-3 text-sm">
                  <Repeat size={16} className="mt-0.5 shrink-0 text-primary-pressed" aria-hidden />
                  La versión {d.validated.number} está validada y vigente. Existe una nueva propuesta (v{d.pending.number}) pendiente de decisión.
                </p>
              )}

              <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]" aria-label="Detalle del riesgo">
                <section className="min-w-0 space-y-4" aria-label="Contenido, incidencias y versiones">
                  <Card aria-label="Activo y nivel" className={cardClassName.padded}>
                    <dl className="grid gap-x-4 sm:grid-cols-3">
                      <span className="block"><KV k="Activo confirmado" nd={!shown.confirmedAsset}
                        v={shown.confirmedAsset ? <span className="flex flex-wrap items-center gap-2">{shown.confirmedAsset.name}{shown.confirmedAsset.criticality && <CriticalityBadge criticality={shown.confirmedAsset.criticality} />}</span> : 'Sin confirmar'} /></span>
                      <span className="block"><KV k="Nivel" v={<RiskLevelBadge level={shown.evaluation?.levelCode ?? null} />} /></span>
                      <span className="block"><KV k="Probabilidad × impacto" nd={!shown.evaluation} v={shown.evaluation ? `P${shown.evaluation.probability} × I${shown.evaluation.impact} · ${shown.evaluation.matrix.name}` : 'Sin evaluar'} /></span>
                      {shown.evaluation?.justification && <span className="block sm:col-span-3"><KV k="Justificación de la evaluación" v={`${shown.evaluation.justification} — ${shown.evaluation.evaluator.name}, ${formatDateTime(shown.evaluation.evaluatedAt)}`} /></span>}
                    </dl>
                  </Card>
                  <RiskProposalSummarySection version={shown} />
                  <ClusterIncidentsSection included={shown.incidents.filter((i) => i.linkStatus !== INCIDENT_LINK_STATUS.RETIRADA)} excluded={shown.incidents.filter((i) => i.linkStatus === INCIDENT_LINK_STATUS.RETIRADA)}
                    editable={false} restoringAnalysisId={null} onRequestRemove={() => undefined} onRestore={() => undefined} />
                  <VersionHistorySection versions={d.versions} highlightVersionId={shown.id} onOpenWorkspace={d.canReview ? onOpenWorkspace : undefined} />
                </section>
                <aside aria-label="Decisión y fuentes" className="space-y-4 lg:sticky lg:top-20 lg:self-start">
                  <DecisionReadinessArticle version={shown} />
                  <StrategicSourcesAside citations={shown.citations} onInspect={drawer.inspectCitation} />
                </aside>
              </section>
            </>
          )}
        </AsyncContent>
      </main>
    </>
  )
}
