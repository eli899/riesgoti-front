import { BookMarked, ClipboardList, GitMerge, Grid3X3, Headset, LayoutDashboard, Server, UserRound } from 'lucide-react'
import AppShell, { type ShellNavItem } from '@/components/layout/AppShell'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useHashSection } from '@/hooks/useHashSection'
import AccountPage from '@/pages/AccountPage'
import AssetsPage from '@/pages/admin/AssetsPage'
import MatrixPage from '@/pages/admin/MatrixPage'
import RiskDetailPage from '@/pages/risk/RiskDetailPage'
import RiskProposalsQueuePage from '@/pages/risk/RiskProposalsQueuePage'
import RiskRegistryPage from '@/pages/risk/RiskRegistryPage'
import RiskWorkspacePage from '@/pages/risk/RiskWorkspacePage'
import type { PermissionCode } from '@/types/domain.types'
import AnalystSummaryPage from './AnalystSummaryPage'
import SupportDetailPage from './SupportDetailPage'
import SupportListPage from './SupportListPage'

const SECTIONS = ['summary', 'incidents', 'support', 'case', 'proposals', 'workspace', 'registry', 'risk', 'assets', 'matrix', 'account'] as const
type AnalystSection = (typeof SECTIONS)[number]

const NAV: (ShellNavItem<AnalystSection> & { permission?: PermissionCode })[] = [
  { id: 'summary', label: 'Resumen', icon: <LayoutDashboard size={20} />, group: 'General', permission: 'riesgo.consultar' },
  { id: 'incidents', label: 'Incidencias', icon: <ClipboardList size={20} />, group: 'Operación', permission: 'incidencia.ver_todas' },
  { id: 'support', label: 'Atención de incidencias', icon: <Headset size={20} />, group: 'Operación', permission: 'atencion.ver_cola' },
  { id: 'proposals', label: 'Propuestas de riesgo', icon: <GitMerge size={20} />, group: 'Gobierno de riesgos', permission: 'riesgo.revisar_agrupacion' },
  { id: 'registry', label: 'Registro de riesgos', icon: <BookMarked size={20} />, group: 'Gobierno de riesgos', permission: 'riesgo.consultar' },
  { id: 'assets', label: 'Activos', icon: <Server size={20} />, group: 'Consulta' },
  { id: 'matrix', label: 'Matriz de evaluación', icon: <Grid3X3 size={20} />, group: 'Consulta' },
  { id: 'account', label: 'Mi cuenta', icon: <UserRound size={20} />, group: 'Cuenta' },
]

// Secciones de detalle: resaltan en la navegación la sección desde la que se abren.
const PARENT: Partial<Record<AnalystSection, AnalystSection>> = { workspace: 'proposals', risk: 'registry' }

/**
 * Consola del Analista N2: operación (incidencias, cola N2 y caso #/case/{id}), gobierno de riesgos (propuestas,
 * espacio de trabajo #/workspace/{versionId}, registro y detalle #/risk/{riskId}), consulta de activos y matriz, y cuenta.
 */
export default function AnalystPortal() {
  const { currentUser, hasPermission, logout } = useAuthSession()
  const items = NAV.filter((i) => !i.permission || hasPermission(i.permission))
  const { section, param, navigate } = useHashSection(SECTIONS, items[0]?.id ?? 'summary')

  if (!currentUser) return null

  // El detalle del caso recuerda desde qué bandeja se abrió para volver a ella.
  const origin: AnalystSection = param?.endsWith('-all') ? 'incidents' : 'support'
  const id = param && /^\d+/.test(param) ? Number.parseInt(param, 10) : null
  const openCase = (from: 'support' | 'incidents') => (incidentId: number) => navigate('case', from === 'incidents' ? `${incidentId}-all` : incidentId)
  const openWorkspace = (versionId: number) => navigate('workspace', versionId)
  const openRisk = (riskId: number) => navigate('risk', riskId)
  const active = section === 'case' ? origin : PARENT[section] ?? section

  return (
    <AppShell navLabel="Navegación principal por rol: Analista" items={items} active={active} user={currentUser} onNavigate={navigate} onLogout={logout}>
      <div key={`${section}-${param ?? ''}`}>
        {section === 'summary' && <AnalystSummaryPage onOpenProposal={openWorkspace} />}
        {section === 'support' && <SupportListPage mode="queue" onOpen={openCase('support')} />}
        {section === 'incidents' && <SupportListPage mode="all" onOpen={openCase('incidents')} />}
        {section === 'case' && (
          <SupportDetailPage incidentId={id} onBack={() => navigate(origin)} backLabel={origin === 'incidents' ? 'Incidencias' : 'Atención de incidencias'} onOpenRisk={openWorkspace} />
        )}
        {section === 'proposals' && <RiskProposalsQueuePage onOpen={openWorkspace} />}
        {section === 'workspace' && <RiskWorkspacePage versionId={id} onBack={() => navigate('proposals')} onOpenVersion={openWorkspace} onOpenRisk={openRisk} />}
        {section === 'registry' && <RiskRegistryPage onOpen={openRisk} />}
        {section === 'risk' && <RiskDetailPage riskId={id} onBack={() => navigate('registry')} onOpenWorkspace={openWorkspace} />}
        {section === 'assets' && <AssetsPage />}
        {section === 'matrix' && <MatrixPage />}
        {section === 'account' && <AccountPage />}
      </div>
    </AppShell>
  )
}
