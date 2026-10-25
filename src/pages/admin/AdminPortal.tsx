import { BookMarked, Bot, ClipboardList, FileText, GitMerge, Grid3X3, KeyRound, LayoutDashboard, ScrollText, Server, UserRound, Users } from 'lucide-react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import AppShell, { type ShellNavItem } from '@/components/layout/AppShell'
import RouteIdParam from '@/components/layout/RouteIdParam'
import RouteViewport from '@/components/layout/RouteViewport'
import { NAV_GROUPS, NAV_LABELS, PORTAL_NAV_ARIA_LABELS } from '@/constants/navigation.constants'
import { ROUTE_PARAMS, ROUTE_PATHS, ROUTES } from '@/constants/routes.constants'
import PermissionRoute from '@/features/auth/PermissionRoute'
import { useAuthSession } from '@/hooks/useAuthSession'
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

const NAV: (ShellNavItem & { permission?: PermissionCode })[] = [
  { to: ROUTE_PATHS.DASHBOARD, label: NAV_LABELS.DASHBOARD, icon: <LayoutDashboard size={20} />, group: NAV_GROUPS.GENERAL, permission: 'riesgo.consultar' },
  { to: ROUTE_PATHS.INCIDENTS, label: NAV_LABELS.INCIDENTS, icon: <ClipboardList size={20} />, group: NAV_GROUPS.QUERY, permission: 'incidencia.ver_todas' },
  { to: ROUTE_PATHS.RISKS, label: NAV_LABELS.RISKS, icon: <BookMarked size={20} />, group: NAV_GROUPS.QUERY, permission: 'riesgo.consultar' },
  { to: ROUTE_PATHS.PROPOSALS, label: NAV_LABELS.PROPOSALS, icon: <GitMerge size={20} />, group: NAV_GROUPS.QUERY, permission: 'riesgo.consultar' },
  { to: ROUTE_PATHS.ASSETS, label: NAV_LABELS.ASSETS, icon: <Server size={20} />, group: NAV_GROUPS.RISK_GOVERNANCE, permission: 'activo.administrar' },
  { to: ROUTE_PATHS.MATRIX, label: NAV_LABELS.MATRIX, icon: <Grid3X3 size={20} />, group: NAV_GROUPS.RISK_GOVERNANCE, permission: 'matriz.administrar' },
  { to: ROUTE_PATHS.DOCUMENTS, label: NAV_LABELS.DOCUMENTS, icon: <FileText size={20} />, group: NAV_GROUPS.ARTIFICIAL_INTELLIGENCE, permission: 'documento.administrar' },
  { to: ROUTE_PATHS.AI_CONFIG, label: NAV_LABELS.AI_CONFIG, icon: <Bot size={20} />, group: NAV_GROUPS.ARTIFICIAL_INTELLIGENCE, permission: 'documento.administrar' },
  { to: ROUTE_PATHS.USERS, label: NAV_LABELS.USERS, icon: <Users size={20} />, group: NAV_GROUPS.ACCESS, permission: 'usuario.administrar' },
  { to: ROUTE_PATHS.ROLES, label: NAV_LABELS.ROLES, icon: <KeyRound size={20} />, group: NAV_GROUPS.ACCESS, permission: 'rol.administrar' },
  { to: ROUTE_PATHS.AUDIT, label: NAV_LABELS.AUDIT, icon: <ScrollText size={20} />, group: NAV_GROUPS.ACCESS, permission: 'usuario.administrar' },
  { to: ROUTE_PATHS.ACCOUNT, label: NAV_LABELS.ACCOUNT, icon: <UserRound size={20} />, group: NAV_GROUPS.ACCOUNT },
]

/**
 * Portal del Administrador: configuración (IA/RAG, documentos, matriz, activos, accesos y auditoría) y consulta de
 * incidencias y riesgos en modo lectura: el ADMIN no atiende casos ni revisa, evalúa o valida riesgos (INV-05), por lo
 * que no monta /support. Las rutas de detalle heredan el permiso de su sección de origen.
 */
export default function AdminPortal() {
  const { currentUser, hasPermission, logout } = useAuthSession()
  const navigate = useNavigate()

  if (!currentUser) return null

  const items = NAV.filter((i) => !i.permission || hasPermission(i.permission))
  const home = items[0]?.to ?? ROUTES.ACCOUNT
  const openWorkspace = (versionId: number) => navigate(ROUTES.PROPOSAL_WORKSPACE(versionId))
  const openRisk = (riskId: number) => navigate(ROUTES.RISK_DETAIL(riskId))

  return (
    <AppShell navLabel={PORTAL_NAV_ARIA_LABELS.ADMIN} items={items} user={currentUser} onLogout={logout}>
      <RouteViewport>
        <Routes>
          <Route index element={<Navigate replace to={home} />} />
          <Route element={<PermissionRoute permission="riesgo.consultar" redirectTo={home} />}>
            <Route path={ROUTE_PATHS.DASHBOARD} element={<AdminDashboardPage onOpenDocuments={() => navigate(ROUTES.DOCUMENTS)} />} />
            <Route path={ROUTE_PATHS.RISKS} element={<RiskRegistryPage onOpen={openRisk} />} />
            <Route path={ROUTE_PATHS.RISK_DETAIL} element={
              <RouteIdParam param={ROUTE_PARAMS.RISK_ID}>
                {(riskId) => <RiskDetailPage riskId={riskId} onBack={() => navigate(ROUTES.RISKS)} onOpenWorkspace={openWorkspace} />}
              </RouteIdParam>
            } />
            <Route path={ROUTE_PATHS.PROPOSALS} element={<RiskProposalsQueuePage onOpen={openWorkspace} />} />
            <Route path={ROUTE_PATHS.PROPOSAL_WORKSPACE} element={
              <RouteIdParam param={ROUTE_PARAMS.VERSION_ID}>
                {(versionId) => <RiskWorkspacePage versionId={versionId} onBack={() => navigate(ROUTES.PROPOSALS)} onOpenVersion={openWorkspace} onOpenRisk={openRisk} />}
              </RouteIdParam>
            } />
          </Route>
          <Route element={<PermissionRoute permission="incidencia.ver_todas" redirectTo={home} />}>
            <Route path={ROUTE_PATHS.INCIDENTS} element={<SupportListPage mode="all" onOpen={(incidentId) => navigate(ROUTES.INCIDENT_DETAIL(incidentId))} />} />
            <Route path={ROUTE_PATHS.INCIDENT_DETAIL} element={
              <RouteIdParam param={ROUTE_PARAMS.INCIDENT_ID}>
                {(incidentId) => <SupportDetailPage incidentId={incidentId} onBack={() => navigate(ROUTES.INCIDENTS)} backLabel={NAV_LABELS.INCIDENTS} onOpenRisk={openWorkspace} />}
              </RouteIdParam>
            } />
          </Route>
          <Route element={<PermissionRoute permission="activo.administrar" redirectTo={home} />}>
            <Route path={ROUTE_PATHS.ASSETS} element={<AssetsPage />} />
          </Route>
          <Route element={<PermissionRoute permission="matriz.administrar" redirectTo={home} />}>
            <Route path={ROUTE_PATHS.MATRIX} element={<MatrixPage />} />
          </Route>
          <Route element={<PermissionRoute permission="documento.administrar" redirectTo={home} />}>
            <Route path={ROUTE_PATHS.DOCUMENTS} element={<DocsPage />} />
            <Route path={ROUTE_PATHS.AI_CONFIG} element={<AIConfigPage />} />
          </Route>
          <Route element={<PermissionRoute permission="usuario.administrar" redirectTo={home} />}>
            <Route path={ROUTE_PATHS.USERS} element={<UsersPage />} />
            <Route path={ROUTE_PATHS.AUDIT} element={<AuditPage />} />
          </Route>
          <Route element={<PermissionRoute permission="rol.administrar" redirectTo={home} />}>
            <Route path={ROUTE_PATHS.ROLES} element={<RolesPage />} />
          </Route>
          <Route path={ROUTE_PATHS.ACCOUNT} element={<AccountPage />} />
          <Route path={ROUTE_PATHS.WILDCARD} element={<Navigate replace to={home} />} />
        </Routes>
      </RouteViewport>
    </AppShell>
  )
}
