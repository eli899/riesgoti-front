import AsyncContent from '@/components/AsyncContent'
import RiskDashboardKpiSection from '@/components/risk/RiskDashboardKpiSection'
import RiskRegistryTable from '@/components/risk/RiskRegistryTable'
import PageMeta from '@/components/seo/PageMeta'
import { Card, EmptyState, PageHeader, Tabs } from '@/components/ui'
import { REGISTRY_TABS, useRiskRegistryAndDashboard } from '@/hooks/risks/useRiskRegistryAndDashboard'

/** Registro de riesgos e indicadores: una fila por RIESGO con su versión validada vigente (ISO/IEC 27005). */
export default function RiskRegistryPage({ onOpen }: { onOpen: (riskId: number) => void }) {
  const r = useRiskRegistryAndDashboard()
  const tabLabel = REGISTRY_TABS.find((t) => t.id === r.activeTab)!.label

  return (
    <>
      <PageMeta title="Registro de riesgos — RiesgoTI" description="Riesgos de seguridad de la información con su versión validada vigente, nivel en la matriz 5x5 e indicadores (ISO/IEC 27005)." />
      <main id="main-content" className="page-in">
        <PageHeader title="Registro de riesgos" sub="Una fila por riesgo con su versión validada vigente. Las versiones se consultan en el detalle." />
        <AsyncContent isLoading={r.isLoading} error={r.loadError} onRetry={r.retryLoad} label="el registro de riesgos">
          {r.dashboard && <RiskDashboardKpiSection dashboard={r.dashboard} />}
          <Tabs label="Clasificación del registro de riesgos" tabs={r.tabs} value={r.activeTab} onChange={r.setActiveTab} />
          <Card aria-labelledby="registry-heading">
            <h2 id="registry-heading" className="sr-only">{tabLabel}</h2>
            {r.rows.length ? <RiskRegistryTable rows={r.rows} onOpen={onOpen} /> : <EmptyState title="Sin riesgos" text="No hay riesgos en esta categoría." />}
          </Card>
        </AsyncContent>
      </main>
    </>
  )
}
