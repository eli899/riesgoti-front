import type { ReactNode } from 'react'
import { BookMarked, Bot, ClipboardList, FileText, GitMerge, Grid3X3, KeyRound, LayoutDashboard, ScrollText, Server, UserRound, Users } from 'lucide-react'
import AppShell, { type ShellNavItem } from '@/components/layout/AppShell'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useHashSection } from '@/hooks/useHashSection'
import AccountPage from '@/pages/AccountPage'
import RiskDetailPage from '@/pages/risk/RiskDetailPage'
import RiskProposalsQueuePage from '@/pages/risk/RiskProposalsQueuePage'
import RiskRegistryPage from '@/pages/risk/RiskRegistryPage'
import RiskWorkspacePage from '@/pages/risk/RiskWorkspacePage'
import SupportDetailPage from '@/pages/staff/SupportDetailPage'
import SupportListPage from '@/pages/staff/SupportListPage'
import type { PermissionCode } from '@/types/domain.types'
import AdminDashboardPage from './AdminDashboardPage'
import AIConfigPage from './AIConfigPage'
import AssetsPage from './AssetsPage'
import AuditPage from './AuditPage'
import DocsPage from './DocsPage'
import MatrixPage from './MatrixPage'
import RolesPage from './RolesPage'
import UsersPage from './UsersPage'

const SECTIONS = [
  'dashboard', 'incidents', 'case', 'registry', 'risk', 'proposals', 'workspace',
  'assets', 'matrix', 'docs', 'ai', 'users', 'roles', 'audit', 'account',
] as const
type AdminSection = (typeof SECTIONS)[number]

const NAV: (ShellNavItem<AdminSection> & { permission?: PermissionCode })[] = [
  { id: 'dashboard', label: 'Resumen', icon: <LayoutDashboard size={20} />, group: 'General', permission: 'riesgo.consultar' },
  { id: 'incidents', label: 'Incidencias', icon: <ClipboardList size={20} />, group: 'Consulta', permission: 'incidencia.ver_todas' },
  { id: 'registry', label: 'Registro de riesgos', icon: <BookMarked size={20} />, group: 'Consulta', permission: 'riesgo.consultar' },
  { id: 'proposals', label: 'Propuestas de riesgo', icon: <GitMerge size={20} />, group: 'Consulta', permission: 'riesgo.consultar' },
  { id: 'assets', label: 'Activos', icon: <Server size={20} />, group: 'Gobierno de riesgos', permission: 'activo.administrar' },
  { id: 'matrix', label: 'Matriz de evaluación', icon: <Grid3X3 size={20} />, group: 'Gobierno de riesgos', permission: 'matriz.administrar' },
  { id: 'docs', label: 'Documentos', icon: <FileText size={20} />, group: 'Inteligencia artificial', permission: 'documento.administrar' },
  { id: 'ai', label: 'Configuración IA/RAG', icon: <Bot size={20} />, group: 'Inteligencia artificial', permission: 'documento.administrar' },
  { id: 'users', label: 'Usuarios', icon: <Users size={20} />, group: 'Accesos', permission: 'usuario.administrar' },
  { id: 'roles', label: 'Roles y permisos', icon: <KeyRound size={20} />, group: 'Accesos', permission: 'rol.administrar' },
  { id: 'audit', label: 'Auditoría', icon: <ScrollText size={20} />, group: 'Accesos', permission: 'usuario.administrar' },
  { id: 'account', label: 'Mi cuenta', icon: <UserRound size={20} />, group: 'Cuenta' },
]

// Secciones de detalle: solo accesibles si lo es su sección de origen, que queda resaltada en la navegación.
const PARENT: Partial<Record<AdminSection, AdminSection>> = { case: 'incidents', risk: 'registry', workspace: 'proposals' }

/**
 * Portal del Administrador: configuración (IA/RAG, documentos, matriz, activos, accesos y auditoría) y consulta de
 * incidencias y riesgos en modo lectura: el ADMIN no atiende casos ni revisa, evalúa o valida riesgos (INV-05).
 */
export default function AdminPortal() {
  const { currentUser, hasPermission, logout } = useAuthSession()
  const items = NAV.filter((i) => !i.permission || hasPermission(i.permission))
  const navIds: AdminSection[] = items.map((i) => i.id)
  const allowed = SECTIONS.filter((s) => navIds.includes(s) || (PARENT[s] !== undefined && navIds.includes(PARENT[s])))
  const { section, param, navigate } = useHashSection(allowed, allowed[0] ?? 'account')

  if (!currentUser) return null

  const id = param && /^\d+$/.test(param) ? Number(param) : null
  const openWorkspace = (versionId: number) => navigate('workspace', versionId)
  const openRisk = (riskId: number) => navigate('risk', riskId)

  const page: Record<AdminSection, () => ReactNode> = {
    dashboard: () => <AdminDashboardPage onOpenSection={navigate} />,
    incidents: () => <SupportListPage mode="all" onOpen={(incidentId) => navigate('case', incidentId)} />,
    case: () => <SupportDetailPage incidentId={id} onBack={() => navigate('incidents')} backLabel="Incidencias" onOpenRisk={openWorkspace} />,
    registry: () => <RiskRegistryPage onOpen={openRisk} />,
    risk: () => <RiskDetailPage riskId={id} onBack={() => navigate('registry')} onOpenWorkspace={openWorkspace} />,
    proposals: () => <RiskProposalsQueuePage onOpen={openWorkspace} />,
    workspace: () => <RiskWorkspacePage versionId={id} onBack={() => navigate('proposals')} onOpenVersion={openWorkspace} onOpenRisk={openRisk} />,
    assets: () => <AssetsPage />,
    matrix: () => <MatrixPage />,
    docs: () => <DocsPage />,
    ai: () => <AIConfigPage />,
    users: () => <UsersPage />,
    roles: () => <RolesPage />,
    audit: () => <AuditPage />,
    account: () => <AccountPage />,
  }

  return (
    <AppShell navLabel="Navegación principal por rol: Administrador" items={items} active={PARENT[section] ?? section} user={currentUser} onNavigate={navigate} onLogout={logout}>
      <div key={`${section}-${param ?? ''}`}>{page[section]()}</div>
    </AppShell>
  )
}
