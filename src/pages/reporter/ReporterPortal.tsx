import { useState } from 'react'
import { ClipboardList, Home, UserRound } from 'lucide-react'
import AppShell, { type ShellNavItem } from '@/components/layout/AppShell'
import CreateIncidentFormModal from '@/components/reporter/CreateIncidentFormModal'
import { useReporterIncidents } from '@/hooks/incidents/useReporterIncidents'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useHashSection } from '@/hooks/useHashSection'
import AccountPage from '@/pages/AccountPage'
import type { IncidentFormValues } from '@/schemas/incident.schema'
import IncidentDetailPage from './IncidentDetailPage'
import MyIncidentsPage from './MyIncidentsPage'
import ReporterHomePage from './ReporterHomePage'

const SECTIONS = ['home', 'mine', 'incident', 'account'] as const
type ReporterSection = (typeof SECTIONS)[number]

const NAV: ShellNavItem<ReporterSection>[] = [
  { id: 'home', label: 'Inicio', icon: <Home size={20} /> },
  { id: 'mine', label: 'Mis incidencias', icon: <ClipboardList size={20} /> },
  { id: 'account', label: 'Mi cuenta', icon: <UserRound size={20} /> },
]

/** Portal del Reportante: inicio, bandeja y detalle (#/incident/{id}), con el formulario de reporte compartido. */
export default function ReporterPortal() {
  const { currentUser, logout } = useAuthSession()
  const reporter = useReporterIncidents()
  const { section, param, navigate } = useHashSection(SECTIONS, 'home')
  const [reporting, setReporting] = useState(false)

  if (!currentUser) return null

  const openIncident = (id: number) => navigate('incident', id)
  const submitIncident = async (values: IncidentFormValues) => {
    const { failure, incidentId } = await reporter.reportIncident(values)
    if (incidentId !== undefined) {
      setReporting(false)
      openIncident(incidentId) // Redirección inmediata al detalle para seguir la orientación.
    }
    return failure
  }

  const incidentId = param !== null && /^\d+$/.test(param) ? Number(param) : null

  return (
    <AppShell navLabel="Navegación principal por rol: Reportante" items={NAV} active={section === 'incident' ? 'mine' : section} user={currentUser} onNavigate={navigate} onLogout={logout}>
      <div key={`${section}-${param ?? ''}`}>
        {section === 'home' && <ReporterHomePage reporter={reporter} onReport={() => setReporting(true)} onOpenIncident={openIncident} onSeeAll={() => navigate('mine')} />}
        {section === 'mine' && <MyIncidentsPage reporter={reporter} onReport={() => setReporting(true)} onOpenIncident={openIncident} />}
        {section === 'incident' && <IncidentDetailPage incidentId={incidentId} onBack={() => navigate('mine')} />}
        {section === 'account' && <AccountPage />}
      </div>
      <CreateIncidentFormModal open={reporting} assets={reporter.assets} isSubmitting={reporter.isCreating} onClose={() => setReporting(false)} onSubmit={submitIncident} />
    </AppShell>
  )
}
