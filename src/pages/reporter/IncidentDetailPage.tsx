import { useEffect } from 'react'
import AsyncContent from '@/components/AsyncContent'
import IncidentReportArticle, { HumanAttentionNotice } from '@/components/incidents/IncidentReportArticle'
import OperationalGuidanceSection from '@/components/incidents/OperationalGuidanceSection'
import OperationalStrategicStatusAside from '@/components/incidents/OperationalStrategicStatusAside'
import PageMeta from '@/components/seo/PageMeta'
import { BackLink, Button, ErrorState, PageHeader, StatusBadge } from '@/components/ui'
import { useOperationalGuidance } from '@/hooks/incidents/useOperationalGuidance'
import { useCitationDrawer } from '@/hooks/useCitationDrawer'
import { formatDateTime } from '@/lib/format'

/** Detalle de una incidencia: orientación operativa RAG con citas, confirmación y estado de ambas ramas. */
export default function IncidentDetailPage({ incidentId, onBack }: { incidentId: number | null; onBack: () => void }) {
  const detail = useOperationalGuidance(incidentId)
  const drawer = useCitationDrawer()
  const { closeDrawer } = drawer
  const incident = detail.incident

  // El panel de citas pertenece a esta vista: se cierra al salir de ella.
  useEffect(() => () => {
    closeDrawer()
  }, [closeDrawer])

  const back = <BackLink onClick={onBack}>Mis incidencias</BackLink>

  if (incidentId === null || detail.notFound) {
    return (
      <main id="main-content" className="page-in">
        <PageMeta title="Incidencia no encontrada" description="La incidencia solicitada no existe o no tienes permiso para consultarla." />
        <h1 className="sr-only">Incidencia no encontrada</h1>
        {back}
        <ErrorState title="Incidencia no disponible" text="No existe o fue registrada por otra persona." action={<Button variant="secondary" onClick={onBack}>Volver</Button>} />
      </main>
    )
  }

  return (
    <>
      <PageMeta
        title={incident ? `Incidencia ${incident.reference}: ${incident.title}` : 'Detalle de incidencia'}
        description="Orientación operativa asistida por IA con fuentes normativas citadas y seguimiento del análisis de riesgo."
      />
      <main id="main-content" className="page-in">
        {!incident && <h1 className="sr-only">Detalle de incidencia</h1>}
        <AsyncContent isLoading={detail.isLoading} error={detail.loadError} onRetry={detail.retryLoad} label="la incidencia">
          {incident && (
            <>
              <PageHeader
                back={back}
                title={incident.title}
                sub={<span className="flex flex-wrap items-center gap-2"><span className="font-mono text-primary-pressed">{incident.reference}</span>· Registrada el {formatDateTime(incident.registeredAt)}</span>}
                actions={<StatusBadge status={incident.status} />}
              />
              <section className="grid gap-4 lg:grid-cols-[1fr_360px]" aria-label="Detalle del caso">
                <section className="min-w-0 space-y-4" aria-label="Orientación y reporte">
                  <OperationalGuidanceSection
                    guidance={detail.guidance}
                    canGiveFeedback={detail.canGiveFeedback}
                    isSubmittingFeedback={detail.isSubmittingFeedback}
                    onFeedback={detail.sendFeedback}
                    onInspectCitation={drawer.inspectCitation}
                  />
                  <HumanAttentionNotice incident={incident} />
                  <IncidentReportArticle incident={incident} onDownloadEvidence={detail.downloadEvidence} />
                </section>
                <OperationalStrategicStatusAside incident={incident} />
              </section>
            </>
          )}
        </AsyncContent>
      </main>
    </>
  )
}
