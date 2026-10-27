import { BookMarked, ClipboardList, GitMerge, Grid3X3, Headset, LayoutDashboard, Server, UserRound } from 'lucide-react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import AppShell, { type ShellNavItem } from '@/components/layout/AppShell'
import RouteIdParam from '@/components/layout/RouteIdParam'
import RouteViewport from '@/components/layout/RouteViewport'
import { NAV_GROUPS, NAV_LABELS, PORTAL_NAV_ARIA_LABELS } from '@/constants/navigation.constants'
import { ROUTE_PARAMS, ROUTE_PATHS, ROUTES } from '@/constants/routes.constants'
import PermissionRoute from '@/features/auth/PermissionRoute'
import { useAuthSession } from '@/hooks/useAuthSession'
import AccountPage from '@/pages/AccountPage'
import AssetsPage from '@/pages/admin/AssetsPage'
import MatrixPage from '@/pages/admin/MatrixPage'
import RiskDetailPage from '@/pages/risk/RiskDetailPage'
import RiskProposalsQueuePage from '@/pages/risk/RiskProposalsQueuePage'
import RiskRegistryPage from '@/pages/risk/RiskRegistryPage'
import RiskWorkspacePage from '@/pages/risk/RiskWorkspacePage'
import type { PermissionCode } from '@/types/domain.types'
import { PERMISSIONS } from '@/constants/rbac.constants'
import AnalystSummaryPage from './AnalystSummaryPage'
import SupportDetailPage from './SupportDetailPage'
import SupportListPage from './SupportListPage'

const NAV: (ShellNavItem & { permission?: PermissionCode })[] = [
  { to: ROUTE_PATHS.DASHBOARD, label: NAV_LABELS.DASHBOARD, icon: <LayoutDashboard size={20} />, group: NAV_GROUPS.GENERAL, permission: PERMISSIONS.RISK_QUERY },
  { to: ROUTE_PATHS.INCIDENTS, label: NAV_LABELS.INCIDENTS, icon: <ClipboardList size={20} />, group: NAV_GROUPS.OPERATION, permission: PERMISSIONS.INCIDENT_VIEW_ALL },
  { to: ROUTE_PATHS.SUPPORT, label: NAV_LABELS.SUPPORT, icon: <Headset size={20} />, group: NAV_GROUPS.OPERATION, permission: PERMISSIONS.ATTENTION_VIEW_QUEUE },
  { to: ROUTE_PATHS.PROPOSALS, label: NAV_LABELS.PROPOSALS, icon: <GitMerge size={20} />, group: NAV_GROUPS.RISK_GOVERNANCE, permission: PERMISSIONS.RISK_REVIEW_GROUPING },
  { to: ROUTE_PATHS.RISKS, label: NAV_LABELS.RISKS, icon: <BookMarked size={20} />, group: NAV_GROUPS.RISK_GOVERNANCE, permission: PERMISSIONS.RISK_QUERY },
  { to: ROUTE_PATHS.ASSETS, label: NAV_LABELS.ASSETS, icon: <Server size={20} />, group: NAV_GROUPS.QUERY },
  { to: ROUTE_PATHS.MATRIX, label: NAV_LABELS.MATRIX, icon: <Grid3X3 size={20} />, group: NAV_GROUPS.QUERY },
  { to: ROUTE_PATHS.ACCOUNT, label: NAV_LABELS.ACCOUNT, icon: <UserRound size={20} />, group: NAV_GROUPS.ACCOUNT },
]

/**
 * Consola del Analista N2: operación (incidencias y cola N2, con el caso bajo la bandeja de origen: /incidents/{id} o
 * /support/{id}), gobierno de riesgos (propuestas y espacio de trabajo /proposals/{versionId}, registro y detalle
 * /risks/{riskId}), consulta de activos y matriz, y cuenta.
 */
export default function AnalystPortal() {
  const { currentUser, hasPermission, logout } = useAuthSession()
  const navigate = useNavigate()

  if (!currentUser) return null

  const items = NAV.filter((i) => !i.permission || hasPermission(i.permission))
  const home = items[0]?.to ?? ROUTES.ACCOUNT
  const openWorkspace = (versionId: number) => navigate(ROUTES.PROPOSAL_WORKSPACE(versionId))
  const openRisk = (riskId: number) => navigate(ROUTES.RISK_DETAIL(riskId))

  return (
    <AppShell navLabel={PORTAL_NAV_ARIA_LABELS.ANALISTA} items={items} user={currentUser} onLogout={logout}>
      <RouteViewport>
        <Routes>
          <Route index element={<Navigate replace to={home} />} />
          <Route element={<PermissionRoute permission={PERMISSIONS.RISK_QUERY} redirectTo={home} />}>
            <Route path={ROUTE_PATHS.DASHBOARD} element={<AnalystSummaryPage onOpenProposal={openWorkspace} />} />
            <Route path={ROUTE_PATHS.RISKS} element={<RiskRegistryPage onOpen={openRisk} />} />
            <Route path={ROUTE_PATHS.RISK_DETAIL} element={
              <RouteIdParam param={ROUTE_PARAMS.RISK_ID}>
                {(riskId) => <RiskDetailPage riskId={riskId} onBack={() => navigate(ROUTES.RISKS)} onOpenWorkspace={openWorkspace} />}
              </RouteIdParam>
            } />
          </Route>
          <Route element={<PermissionRoute permission={PERMISSIONS.INCIDENT_VIEW_ALL} redirectTo={home} />}>
            <Route path={ROUTE_PATHS.INCIDENTS} element={<SupportListPage mode="all" onOpen={(incidentId) => navigate(ROUTES.INCIDENT_DETAIL(incidentId))} />} />
            <Route path={ROUTE_PATHS.INCIDENT_DETAIL} element={
              <RouteIdParam param={ROUTE_PARAMS.INCIDENT_ID}>
                {(incidentId) => <SupportDetailPage incidentId={incidentId} onBack={() => navigate(ROUTES.INCIDENTS)} backLabel={NAV_LABELS.INCIDENTS} onOpenRisk={openWorkspace} />}
              </RouteIdParam>
            } />
          </Route>
          <Route element={<PermissionRoute permission={PERMISSIONS.ATTENTION_VIEW_QUEUE} redirectTo={home} />}>
            <Route path={ROUTE_PATHS.SUPPORT} element={<SupportListPage mode="queue" onOpen={(incidentId) => navigate(ROUTES.SUPPORT_CASE(incidentId))} />} />
            <Route path={ROUTE_PATHS.SUPPORT_CASE} element={
              <RouteIdParam param={ROUTE_PARAMS.INCIDENT_ID}>
                {(incidentId) => <SupportDetailPage incidentId={incidentId} onBack={() => navigate(ROUTES.SUPPORT)} backLabel={NAV_LABELS.SUPPORT} onOpenRisk={openWorkspace} />}
              </RouteIdParam>
            } />
          </Route>
          <Route element={<PermissionRoute permission={PERMISSIONS.RISK_REVIEW_GROUPING} redirectTo={home} />}>
            <Route path={ROUTE_PATHS.PROPOSALS} element={<RiskProposalsQueuePage onOpen={openWorkspace} />} />
            <Route path={ROUTE_PATHS.PROPOSAL_WORKSPACE} element={
              <RouteIdParam param={ROUTE_PARAMS.VERSION_ID}>
                {(versionId) => <RiskWorkspacePage versionId={versionId} onBack={() => navigate(ROUTES.PROPOSALS)} onOpenVersion={openWorkspace} onOpenRisk={openRisk} />}
              </RouteIdParam>
            } />
          </Route>
          <Route path={ROUTE_PATHS.ASSETS} element={<AssetsPage />} />
          <Route path={ROUTE_PATHS.MATRIX} element={<MatrixPage />} />
          <Route path={ROUTE_PATHS.ACCOUNT} element={<AccountPage />} />
          <Route path={ROUTE_PATHS.WILDCARD} element={<Navigate replace to={home} />} />
        </Routes>
      </RouteViewport>
    </AppShell>
  )
}
