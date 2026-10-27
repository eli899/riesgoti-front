import { ChartCard, HorizontalBars } from '@/components/dashboard/charts'
import KpiSection from '@/components/dashboard/KpiSection'
import { RISK_LEVEL_LABEL } from '@/constants/labels.constants'
import type { RiskDashboard } from '@/types/domain.types'
import { RISK_LEVELS_HIGH_OR_CRITICAL } from '@/constants/domain.constants'

/** Indicadores del gobierno de riesgos (GET /risks/dashboard/) calculados sobre la versión validada vigente por riesgo. */
export default function RiskDashboardKpiSection({ dashboard }: { dashboard: RiskDashboard }) {
  const levels = [...dashboard.currentRisksByLevel].sort((a, b) => b.order - a.order)
  const highCritical = levels.filter((l) => RISK_LEVELS_HIGH_OR_CRITICAL.includes(l.levelCode)).reduce((a, l) => a + l.total, 0)

  return (
    <>
      <KpiSection id="risk-kpis" kpis={[
        { label: 'Riesgos vigentes', value: dashboard.currentRisks, hint: `${dashboard.totalRisks} riesgos registrados en total` },
        { label: 'Nivel alto o crítico', value: highCritical, hint: 'Sobre la versión validada vigente', emphasis: highCritical > 0 },
        { label: 'Propuestas pendientes', value: dashboard.pendingProposals, hint: `${dashboard.possibleRecurrenceProposals} por posible recurrencia`, emphasis: dashboard.pendingProposals > 0 },
        { label: 'Versiones rechazadas', value: dashboard.rejectedVersions, hint: 'Conservadas en el historial' },
      ]} />
      <section aria-labelledby="risk-levels-heading" className="mb-6">
        <h2 id="risk-levels-heading" className="sr-only">Distribución por nivel</h2>
        <ChartCard id="risk-levels" title="Riesgos vigentes por nivel" period="Versión validada vigente"
          summary={levels.map((l) => `${RISK_LEVEL_LABEL[l.levelCode]}: ${l.total}`).join(', ')}>
          <HorizontalBars unit="riesgos" emptyText="Aún no hay riesgos validados." data={levels.map((l) => ({ label: RISK_LEVEL_LABEL[l.levelCode], value: l.total }))} />
        </ChartCard>
      </section>
    </>
  )
}
