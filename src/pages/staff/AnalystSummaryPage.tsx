import AsyncContent from '@/components/AsyncContent'
import { ChartCard, DailyBarChart, HorizontalBars } from '@/components/dashboard/charts'
import KpiSection from '@/components/dashboard/KpiSection'
import PageMeta from '@/components/seo/PageMeta'
import PendingProposalsArticle from '@/components/staff/PendingProposalsArticle'
import { Chips, PageHeader } from '@/components/ui'
import { useAnalystSummary, type SummaryPeriod } from '@/hooks/incidents/useAnalystSummary'
import { RISK_LEVEL_LABEL } from '@/constants/labels.constants'
import { cn } from '@/lib/utils'
import { inputClassName } from '@/styles/tokens.form'
import { RISK_LEVELS_HIGH_OR_CRITICAL } from '@/constants/domain.constants'
import { FILTER_ALL } from '@/constants/ui.constants'

const PERIODS: { id: SummaryPeriod; label: string }[] = [
  { id: '7', label: 'Últimos 7 días' },
  { id: '30', label: 'Últimos 30 días' },
  { id: FILTER_ALL, label: 'Todo' },
]

/** Resumen operativo del Analista: incidencias del periodo, cola N2 y estado del gobierno de riesgos. */
export default function AnalystSummaryPage({ onOpenProposal }: { onOpenProposal: (versionId: number) => void }) {
  const s = useAnalystSummary()
  const periodLabel = PERIODS.find((p) => p.id === s.period)!.label
  const d = s.dashboard
  const highCritical = d ? d.currentRisksByLevel.filter((l) => RISK_LEVELS_HIGH_OR_CRITICAL.includes(l.levelCode)).reduce((a, l) => a + l.total, 0) : 0

  return (
    <>
      <PageMeta title="Resumen — Consola Analista N2" description="Indicadores de incidencias, cola de atención humana y riesgos pendientes de revisión." />
      <main id="main-content" className="page-in">
        <PageHeader title="Resumen" sub="Panorama operativo y estratégico. Los filtros afectan a los indicadores de incidencias." />
        <nav aria-label="Filtros del resumen" className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Chips label="Periodo" value={s.period} onChange={s.setPeriod} items={PERIODS} />
          <select aria-label="Filtrar por activo" value={s.assetId} onChange={(e) => s.setAssetId(e.target.value === FILTER_ALL ? FILTER_ALL : Number(e.target.value))}
            className={cn(inputClassName(), 'h-10 sm:w-64')}>
            <option value="all">Todos los activos</option>
            {s.assets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </nav>
        <AsyncContent isLoading={s.isLoading} error={s.loadError} onRetry={s.retryLoad} label="el resumen">
          <KpiSection id="analyst-kpis" kpis={[
            { label: 'Incidencias del periodo', value: s.summary.periodCount, hint: `${s.summary.queueCount} requieren atención humana` },
            { label: 'Versiones pendientes de revisión', value: s.pendingVersions.length, hint: 'Todas las fechas y activos', emphasis: s.pendingVersions.length > 0 },
            { label: 'Riesgos con versión validada', value: d?.currentRisks ?? 0, hint: 'Una versión vigente por riesgo' },
            { label: 'Validados de nivel alto o crítico', value: highCritical, hint: 'Sobre la versión vigente' },
          ]} />

          <section aria-labelledby="ops-title" className="mb-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
            <h2 id="ops-title" className="sr-only">Actividad operativa</h2>
            <ChartCard id="analyst-series" title="Incidencias por fecha de registro" period={periodLabel}
              summary={`${s.summary.periodCount} incidencias; ${s.summary.autoResolved} resueltas con orientación automática y ${s.summary.humanResolved} cerradas por otras vías.`}>
              <DailyBarChart data={s.summary.series} unit="incidencias" />
            </ChartCard>
            <ChartCard id="analyst-levels" title="Niveles de riesgos validados" period="Versión vigente" summary={(d?.currentRisksByLevel ?? []).map((l) => `${RISK_LEVEL_LABEL[l.levelCode]}: ${l.total}`).join(', ')}>
              <HorizontalBars unit="riesgos" emptyText="Aún no hay riesgos validados."
                data={[...(d?.currentRisksByLevel ?? [])].sort((a, b) => b.order - a.order).map((l) => ({ label: RISK_LEVEL_LABEL[l.levelCode], value: l.total }))} />
            </ChartCard>
          </section>

          <section aria-labelledby="gov-title" className="grid gap-4 lg:grid-cols-2">
            <h2 id="gov-title" className="sr-only">Activos y propuestas</h2>
            <ChartCard id="analyst-assets" title="Activos con más incidencias" period={periodLabel} summary={s.summary.byAsset.map((a) => `${a.label}: ${a.value}`).join(', ')}>
              <HorizontalBars unit="incidencias" emptyText="No hay incidencias para los filtros seleccionados." data={s.summary.byAsset} />
            </ChartCard>
            <PendingProposalsArticle versions={s.pendingVersions} onOpen={onOpenProposal} />
          </section>
        </AsyncContent>
      </main>
    </>
  )
}
