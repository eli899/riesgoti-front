import { useState } from 'react'
import { ClipboardList, Home, UserRound } from 'lucide-react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import AppShell, { type ShellNavItem } from '@/components/layout/AppShell'
import RouteIdParam from '@/components/layout/RouteIdParam'
import RouteViewport from '@/components/layout/RouteViewport'
import CreateIncidentFormModal from '@/components/reporter/CreateIncidentFormModal'
import { NAV_LABELS, PORTAL_NAV_ARIA_LABELS } from '@/constants/navigation.constants'
import { ROUTE_PARAMS, ROUTE_PATHS, ROUTES } from '@/constants/routes.constants'
import { useReporterIncidents } from '@/hooks/incidents/useReporterIncidents'
import { useAuthSession } from '@/hooks/useAuthSession'
import AccountPage from '@/pages/AccountPage'
import type { IncidentFormValues } from '@/schemas/incident.schema'
import IncidentDetailPage from './IncidentDetailPage'
import MyIncidentsPage from './MyIncidentsPage'
import ReporterHomePage from './ReporterHomePage'

const NAV: ShellNavItem[] = [
  { to: ROUTE_PATHS.HOME, label: NAV_LABELS.HOME, icon: <Home size={20} /> },
  { to: ROUTE_PATHS.MY_INCIDENTS, label: NAV_LABELS.MY_INCIDENTS, icon: <ClipboardList size={20} /> },
  { to: ROUTE_PATHS.ACCOUNT, label: NAV_LABELS.ACCOUNT, icon: <UserRound size={20} /> },
]

/** Portal del Reportante: inicio, bandeja y detalle (/my-incidents/{id}), con el formulario de reporte compartido. */
export default function ReporterPortal() {
  const { currentUser, logout } = useAuthSession()
  const reporter = useReporterIncidents()
  const navigate = useNavigate()
  const [reporting, setReporting] = useState(false)

  if (!currentUser) return null

  const openIncident = (id: number) => navigate(ROUTES.MY_INCIDENT_DETAIL(id))
  const submitIncident = async (values: IncidentFormValues) => {
    const { failure, incidentId } = await reporter.reportIncident(values)
    if (incidentId !== undefined) {
      setReporting(false)
      openIncident(incidentId) // Redirección inmediata al detalle para seguir la orientación.
    }
    return failure
  }

  return (
    <AppShell navLabel={PORTAL_NAV_ARIA_LABELS.REPORTANTE} items={NAV} user={currentUser} onLogout={logout}>
      <RouteViewport>
        <Routes>
          <Route index element={<Navigate replace to={ROUTES.HOME} />} />
          <Route path={ROUTE_PATHS.HOME} element={
            <ReporterHomePage reporter={reporter} onReport={() => setReporting(true)} onOpenIncident={openIncident} onSeeAll={() => navigate(ROUTES.MY_INCIDENTS)} />
          } />
          <Route path={ROUTE_PATHS.MY_INCIDENTS} element={<MyIncidentsPage reporter={reporter} onReport={() => setReporting(true)} onOpenIncident={openIncident} />} />
          <Route path={ROUTE_PATHS.MY_INCIDENT_DETAIL} element={
            <RouteIdParam param={ROUTE_PARAMS.INCIDENT_ID}>
              {(incidentId) => <IncidentDetailPage incidentId={incidentId} onBack={() => navigate(ROUTES.MY_INCIDENTS)} />}
            </RouteIdParam>
          } />
          <Route path={ROUTE_PATHS.ACCOUNT} element={<AccountPage />} />
          <Route path={ROUTE_PATHS.WILDCARD} element={<Navigate replace to={ROUTES.HOME} />} />
        </Routes>
      </RouteViewport>
      <CreateIncidentFormModal open={reporting} assets={reporter.assets} isSubmitting={reporter.isCreating} onClose={() => setReporting(false)} onSubmit={submitIncident} />
    </AppShell>
  )
}
