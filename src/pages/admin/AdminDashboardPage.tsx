import AsyncContent from '@/components/AsyncContent'
import KpiSection from '@/components/dashboard/KpiSection'
import SystemStatusArticle from '@/components/admin/SystemStatusArticle'
import { ChartCard, DailyBarChart, HorizontalBars } from '@/components/dashboard/charts'
import PageMeta from '@/components/seo/PageMeta'
import { PageHeader } from '@/components/ui'
import { useAdminOverview } from '@/hooks/admin/useAdminOverview'
import { formatDateTime } from '@/lib/format'
import { INCIDENT_STATUS_LABEL, RISK_LEVEL_LABEL } from '@/lib/labels'
import type { IncidentStatus } from '@/types/domain.types'

/** Sub-vista: panorama del administrador (indicadores agregados de RiskDashboardAggregationService). */
export default function AdminDashboardPage({ onOpenDocuments }: { onOpenDocuments: () => void }) {
  const overview = useAdminOverview()
  const d = overview.dashboard

  const totalIncidents = d ? Object.values(d.incidentsByStatus).reduce((a, b) => a + (b ?? 0), 0) : 0
  const humanQueue = d ? (d.incidentsByStatus.PENDIENTE_ATENCION_HUMANA ?? 0) + (d.incidentsByStatus.EN_ATENCION ?? 0) : 0
  const last30 = d ? d.incidentSeries.reduce((a, s) => a + s.total, 0) : 0

  return (
    <>
      <PageMeta title="Panel de administración" description="Indicadores de incidencias, riesgos vigentes y estado de la IA y la base de conocimiento de RiesgoTI." />
      <main id="main-content" className="page-in">
        <PageHeader title="Panel de administración" sub={d ? `Datos generados el ${formatDateTime(d.generatedAt)}` : 'Indicadores de la plataforma.'} />
        <AsyncContent isLoading={overview.isLoading} error={overview.loadError} onRetry={overview.retryLoad} label="los indicadores">
          {d && (
            <>
              <KpiSection id="admin-kpis" kpis={[
                { label: 'Incidencias registradas', value: totalIncidents, hint: `${last30} en los últimos 30 días` },
                { label: 'En atención humana', value: humanQueue, hint: 'Pendientes o en atención por un analista', emphasis: humanQueue > 0 },
                { label: 'Riesgos vigentes', value: d.currentRisks, hint: `${d.totalRisks} riesgos identificados en total` },
                { label: 'Propuestas pendientes', value: d.pendingProposals, hint: `${d.possibleRecurrenceProposals} con posible recurrencia` },
              ]} />

              <section aria-labelledby="activity-title" className="mb-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
                <h2 id="activity-title" className="sr-only">Actividad de incidencias</h2>
                <ChartCard id="series" title="Incidencias por fecha de registro" period="Últimos 30 días" summary={`${last30} incidencias registradas en los últimos 30 días.`}>
                  <DailyBarChart data={d.incidentSeries} unit="incidencias" />
                </ChartCard>
                <ChartCard id="by-status" title="Incidencias por estado" period="Todo el histórico" summary={`${totalIncidents} incidencias en total.`}>
                  <HorizontalBars unit="incidencias" emptyText="Aún no hay incidencias registradas."
                    data={(Object.keys(INCIDENT_STATUS_LABEL) as IncidentStatus[]).map((s) => ({ label: INCIDENT_STATUS_LABEL[s], value: d.incidentsByStatus[s] ?? 0 }))} />
                </ChartCard>
              </section>

              <section aria-labelledby="risk-title" className="grid gap-4 lg:grid-cols-3">
                <h2 id="risk-title" className="sr-only">Riesgos y sistema</h2>
                <ChartCard id="by-level" title="Riesgos vigentes por nivel" period="Versión validada vigente" summary={d.currentRisksByLevel.map((l) => `${RISK_LEVEL_LABEL[l.levelCode]}: ${l.total}`).join(', ')}>
                  <HorizontalBars unit="riesgos" emptyText="Aún no hay riesgos validados."
                    data={[...d.currentRisksByLevel].sort((a, b) => b.order - a.order).map((l) => ({ label: RISK_LEVEL_LABEL[l.levelCode], value: l.total }))} />
                </ChartCard>
                <ChartCard id="by-asset" title="Activos con más incidencias" period="Todo el histórico" summary={d.incidentsByAsset.slice(0, 5).map((a) => `${a.assetName}: ${a.total}`).join(', ')}>
                  <HorizontalBars unit="incidencias" emptyText="Aún no hay incidencias registradas."
                    data={d.incidentsByAsset.slice(0, 5).map((a) => ({ label: a.assetName, value: a.total }))} />
                </ChartCard>
                <SystemStatusArticle aiConfig={overview.aiConfig} knowledgeBase={overview.knowledgeBase} onOpenDocuments={onOpenDocuments} />
              </section>
            </>
          )}
        </AsyncContent>
      </main>
    </>
  )
}
