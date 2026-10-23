import { useEffect, useState } from 'react'
import { ArrowLeft, Grid3X3, Lock, Repeat } from 'lucide-react'
import AsyncContent from '@/components/AsyncContent'
import ClusterIncidentsSection from '@/components/risk/ClusterIncidentsSection'
import DecisionReadinessArticle from '@/components/risk/DecisionReadinessArticle'
import EvaluationFormFieldset from '@/components/risk/EvaluationFormFieldset'
import GroupingConfirmationFieldset from '@/components/risk/GroupingConfirmationFieldset'
import RemoveFalsePositiveModal from '@/components/risk/RemoveFalsePositiveModal'
import RiskDecisionActionFooter from '@/components/risk/RiskDecisionActionFooter'
import RiskDecisionDialogView from '@/components/risk/RiskDecisionDialogView'
import RiskProposalSummarySection from '@/components/risk/RiskProposalSummarySection'
import StrategicSourcesAside from '@/components/risk/StrategicSourcesAside'
import VersionHistorySection from '@/components/risk/VersionHistorySection'
import PageMeta from '@/components/seo/PageMeta'
import { Button, ErrorState, PageHeader, ValidationBadge } from '@/components/ui'
import { useRiskClusterReview } from '@/hooks/risks/useRiskClusterReview'
import { useRiskDecisionFlow } from '@/hooks/risks/useRiskDecisionFlow'
import { useRiskMatrixEvaluation } from '@/hooks/risks/useRiskMatrixEvaluation'
import { useRiskVersionCompare } from '@/hooks/risks/useRiskVersionCompare'
import { useCitationDrawer } from '@/hooks/useCitationDrawer'
import { formatDateTime } from '@/lib/format'
import type { RiskDecisionAction, RiskLinkedIncident } from '@/types/domain.types'

interface RiskWorkspacePageProps {
  versionId: number | null
  onBack: () => void
  /** Abre otra versión del riesgo (la v n+1 creada por una corrección o una versión del historial). */
  onOpenVersion: (versionId: number) => void
  onOpenRisk: (riskId: number) => void
}

/**
 * Espacio de trabajo de una propuesta: depuración de la agrupación IA, activo definitivo, evaluación en la matriz 5x5,
 * decisión ISO/IEC 27005 e historial de versiones del riesgo.
 */
export default function RiskWorkspacePage({ versionId, onBack, onOpenVersion, onOpenRisk }: RiskWorkspacePageProps) {
  const cluster = useRiskClusterReview(versionId)
  const matrix = useRiskMatrixEvaluation(versionId)
  const drawer = useCitationDrawer()
  const { closeDrawer } = drawer
  const decision = useRiskDecisionFlow(versionId, onOpenVersion)
  const [removing, setRemoving] = useState<RiskLinkedIncident | null>(null)
  const [deciding, setDeciding] = useState<RiskDecisionAction | null>(null)
  const [reviewed, setReviewed] = useState(false)
  const version = cluster.version
  const history = useRiskVersionCompare(version?.riskId ?? null)

  useEffect(() => () => {
    closeDrawer()
  }, [closeDrawer])

  const back = (
    <button type="button" onClick={onBack} className="mb-3 flex min-h-11 items-center gap-1 text-[13px] font-medium text-primary-hover">
      <ArrowLeft size={16} aria-hidden />Propuestas de riesgo
    </button>
  )

  if (versionId === null || cluster.notFound) {
    return (
      <main id="main-content" className="page-in">
        <PageMeta title="Propuesta no encontrada — RiesgoTI" description="La versión de riesgo solicitada no existe." />
        <h1 className="sr-only">Propuesta no encontrada</h1>
        {back}
        <ErrorState title="Propuesta no disponible" text="La versión de riesgo solicitada no existe." action={<Button variant="secondary" onClick={onBack}>Volver</Button>} />
      </main>
    )
  }

  return (
    <>
      <PageMeta
        title={version ? `${version.riskCode} v${version.number}: ${version.title} — Propuestas de riesgo` : 'Propuesta de riesgo — RiesgoTI'}
        description="Revisión de la agrupación de incidencias, confirmación del activo y evaluación en la matriz 5x5 (ISO/IEC 27005)."
      />
      <main id="main-content" className="page-in">
        {!version && <h1 className="sr-only">Propuesta de riesgo</h1>}
        <AsyncContent isLoading={cluster.isLoading} error={cluster.loadError} onRetry={cluster.retryLoad} label="la propuesta de riesgo">
          {version && (
            <>
              <PageHeader
                back={back}
                title={version.title}
                sub={
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-mono text-primary-pressed">{version.riskCode}</span>· v{version.number} · {cluster.included.length} incidencias ·{' '}
                    {version.citations.length} fuentes · {version.origin === 'IA' ? 'Propuesta de IA' : `Versión de ${version.createdBy.name}`} · {formatDateTime(version.createdAt)}
                  </span>
                }
                actions={<><ValidationBadge status={version.status} /><Button size="sm" variant="ghost" onClick={() => onOpenRisk(version.riskId)}>Ver detalle del riesgo</Button></>}
              />

              {cluster.isReadOnlyRole && (
                <p role="note" className="mb-4 flex items-start gap-2 rounded-[12px] border border-dashed border-control bg-canvas p-3 text-[13px] text-muted">
                  <Lock size={16} className="mt-0.5 shrink-0" aria-hidden />
                  Modo lectura · Segregación de funciones (ISO/IEC 27001): el Administrador no revisa, evalúa ni valida riesgos.
                </p>
              )}
              {!cluster.isReadOnlyRole && version.status !== 'PENDIENTE' && (
                <p role="note" className="mb-4 flex items-start gap-2 rounded-[12px] bg-canvas p-3 text-[13px] text-muted">
                  <Lock size={16} className="mt-0.5 shrink-0" aria-hidden />Esta versión ya tiene una decisión registrada y es inmutable.
                </p>
              )}
              {version.possibleRecurrence && (
                <p role="note" className="mb-4 flex items-start gap-2 rounded-[12px] border border-mid bg-soft p-3 text-[13px]">
                  <Repeat size={16} className="mt-0.5 shrink-0 text-primary-pressed" aria-hidden />
                  Posible recurrencia de un riesgo ya validado: la versión vigente se mantiene hasta decidir esta propuesta (v{version.number}).
                </p>
              )}

              <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]" aria-label="Espacio de trabajo de la propuesta">
                <section className="min-w-0 space-y-4" aria-label="Revisión y evaluación">
                  <RiskProposalSummarySection version={version} />
                  <ClusterIncidentsSection included={cluster.included} excluded={cluster.excluded} editable={cluster.canReview}
                    restoringAnalysisId={cluster.restoringAnalysisId} onRequestRemove={setRemoving} onRestore={cluster.restoreIncident} />
                  <GroupingConfirmationFieldset version={version} assets={cluster.assets} reportedAssetIds={cluster.reportedAssetIds}
                    includedCount={cluster.included.length} editable={cluster.canReview} isSubmitting={cluster.isConfirming} onConfirm={cluster.confirmGrouping} />
                  <section aria-labelledby="matrix-heading" className="rounded-[18px] border border-line bg-white p-4 shadow-card md:rounded-[14px] md:p-5">
                    <h2 id="matrix-heading" className="mb-1 flex items-center gap-2 text-[15px] font-semibold"><Grid3X3 size={18} className="text-primary" aria-hidden />Evaluación en la matriz 5×5</h2>
                    <p className="mb-4 text-[12px] text-muted">
                      {matrix.matrix ? `Matriz activa: ${matrix.matrix.name} ${matrix.matrix.version}. ` : ''}
                      La recurrencia de incidencias orienta la probabilidad, pero no la determina automáticamente.
                    </p>
                    <AsyncContent isLoading={matrix.isLoading} error={matrix.loadError} onRetry={matrix.retryLoad} label="la matriz de evaluación">
                      {matrix.matrix && (
                        <EvaluationFormFieldset
                          key={`${version.id}-${matrix.evaluation?.evaluatedAt ?? 'new'}`}
                          matrix={matrix.matrix} levelAt={matrix.levelAt} evaluation={matrix.evaluation} editable={matrix.canEvaluate}
                          evaluatedWithPreviousMatrix={matrix.evaluatedWithPreviousMatrix} isSaving={matrix.isSaving} onSave={matrix.evaluate}
                        />
                      )}
                    </AsyncContent>
                  </section>
                  {history.versions.length > 0 && <VersionHistorySection versions={history.versions} highlightVersionId={version.id} onOpenWorkspace={(id) => id !== version.id && onOpenVersion(id)} />}
                </section>
                <aside aria-label="Fuentes y estado de la propuesta" className="space-y-4 lg:sticky lg:top-20 lg:self-start">
                  <DecisionReadinessArticle version={version} />
                  <StrategicSourcesAside citations={version.citations} onInspect={drawer.inspectCitation} />
                </aside>
              </section>
              {decision.canDecide && (
                <RiskDecisionActionFooter reviewed={reviewed} onReviewedChange={setReviewed} validationBlockers={decision.validationBlockers} onAction={setDeciding} />
              )}
            </>
          )}
        </AsyncContent>
      </main>
      <RemoveFalsePositiveModal incident={removing} isSubmitting={cluster.isRemoving} onClose={() => setRemoving(null)} onSubmit={cluster.removeIncident} />
      {version && decision.defaults && decision.correctionDefaults && (
        <RiskDecisionDialogView action={deciding} version={version} defaults={decision.defaults} correctionDefaults={decision.correctionDefaults}
          validationBlockers={decision.validationBlockers} isSubmitting={decision.isSubmitting} onClose={() => setDeciding(null)} onSubmit={decision.decide} />
      )}
    </>
  )
}
