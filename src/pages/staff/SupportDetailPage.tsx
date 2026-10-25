import { useEffect } from 'react'
import { Server } from 'lucide-react'
import AsyncContent from '@/components/AsyncContent'
import IncidentReportArticle from '@/components/incidents/IncidentReportArticle'
import OperationalGuidanceSection from '@/components/incidents/OperationalGuidanceSection'
import OperationalStrategicStatusAside from '@/components/incidents/OperationalStrategicStatusAside'
import PageMeta from '@/components/seo/PageMeta'
import HumanAttentionFormAside from '@/components/staff/HumanAttentionFormAside'
import PriorAISuggestionBadge from '@/components/staff/PriorAISuggestionBadge'
import { BackLink, Button, Card, CriticalityBadge, ErrorState, PageHeader, SectionTitle, StatusBadge } from '@/components/ui'
import { useSupportCaseAttention } from '@/hooks/incidents/useSupportCaseAttention'
import { useCitationDrawer } from '@/hooks/useCitationDrawer'
import { formatDateTime } from '@/lib/format'

/** Consola N2: caso derivado con su contexto completo, historial IA previo e intervención técnica. */
export default function SupportDetailPage({ incidentId, onBack, backLabel, onOpenRisk }: { incidentId: number | null; onBack: () => void; backLabel: string; onOpenRisk?: (versionId: number) => void }) {
  const c = useSupportCaseAttention(incidentId)
  const drawer = useCitationDrawer()
  const { closeDrawer } = drawer
  const incident = c.incident

  useEffect(() => () => {
    closeDrawer()
  }, [closeDrawer])

  const back = <BackLink onClick={onBack}>{backLabel}</BackLink>

  if (incidentId === null || c.notFound) {
    return (
      <main id="main-content" className="page-in">
        <PageMeta title="Incidencia no encontrada — Consola Analista N2" description="La incidencia solicitada no existe." />
        <h1 className="sr-only">Incidencia no encontrada</h1>
        {back}
        <ErrorState title="Incidencia no disponible" text="La referencia no existe." action={<Button variant="secondary" onClick={onBack}>Volver</Button>} />
      </main>
    )
  }

  return (
    <>
      <PageMeta
        title={incident ? `${incident.reference}: ${incident.title} — Consola Analista N2` : 'Caso — Consola Analista N2'}
        description="Contexto del caso derivado, orientación IA previa y registro de la atención humana N2."
      />
      <main id="main-content" className="page-in">
        {!incident && <h1 className="sr-only">Caso derivado</h1>}
        <AsyncContent isLoading={c.isLoading} error={c.loadError} onRetry={c.retryLoad} label="el caso">
          {incident && (
            <>
              <PageHeader
                back={back}
                title={incident.title}
                sub={<span className="flex flex-wrap items-center gap-2"><span className="font-mono text-primary-pressed">{incident.reference}</span>· {incident.reporter.name} · {formatDateTime(incident.registeredAt)} · <PriorAISuggestionBadge incident={incident} /></span>}
                actions={<StatusBadge status={incident.status} />}
              />
              <section className="grid gap-4 lg:grid-cols-[1fr_380px]" aria-label="Caso derivado">
                <section className="min-w-0 space-y-4" aria-label="Contexto del reporte e historial IA previo">
                  <IncidentReportArticle incident={incident} showReporter onDownloadEvidence={c.downloadEvidence} />
                  <section aria-labelledby="prior-ai-guidance-title">
                    <h2 id="prior-ai-guidance-title" className="sr-only">Historial de orientación IA previa</h2>
                    <OperationalGuidanceSection audience="staff" guidance={c.guidance} canGiveFeedback={false} isSubmittingFeedback={false}
                      onFeedback={() => undefined} onInspectCitation={drawer.inspectCitation} />
                  </section>
                </section>
                <aside aria-label="Gestión de atención humana N2 y estado estratégico" className="space-y-4 lg:self-start">
                  <OperationalStrategicStatusAside as="section" staff incident={incident} canRetry={c.canRetryStrategic} isRetrying={c.isRetrying} onRetry={c.retryStrategicAnalysis} onOpenRisk={onOpenRisk} />
                  {c.asset && (
                    <Card aria-labelledby="asset-title" className="p-4">
                      <SectionTitle id="asset-title" icon={<Server size={18} className="text-primary" aria-hidden />} className="mb-2">Activo</SectionTitle>
                      <p className="font-medium">{c.asset.name}</p>
                      <p className="mb-2 text-xs text-muted"><span className="font-mono">{c.asset.code}</span> · {c.asset.typeName}</p>
                      {c.asset.criticality ? <CriticalityBadge criticality={c.asset.criticality} /> : <span className="text-xs text-muted">Sin criticidad registrada</span>}
                    </Card>
                  )}
                  <HumanAttentionFormAside incident={incident} canAttend={c.canAttend} assignedToMe={c.assignedToMe}
                    isStarting={c.isStarting} isSaving={c.isSaving} onStart={c.start} onSave={c.saveAttention} />
                </aside>
              </section>
            </>
          )}
        </AsyncContent>
      </main>
    </>
  )
}
