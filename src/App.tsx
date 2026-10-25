import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import CitationDrawer from '@/components/CitationDrawer'
import { ROUTE_PATHS } from '@/constants/routes.constants'
import { GuestOnlyRoute, ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useCitationDrawer } from '@/hooks/useCitationDrawer'
import LoginPage from '@/pages/LoginPage'
import RolePortalPendingPage from '@/pages/RolePortalPendingPage'

// Un fragmento JS por portal: cada rol descarga solo su propio portal.
const AdminPortal = lazy(() => import('@/pages/admin/AdminPortal'))
const AnalystPortal = lazy(() => import('@/pages/staff/AnalystPortal'))
const ReporterPortal = lazy(() => import('@/pages/reporter/ReporterPortal'))

const PortalFallback = () => <p role="status" className="grid min-h-screen place-items-center text-sm text-muted">Cargando tu portal…</p>

/** Portal del rol autenticado; cada uno declara sus propias rutas bajo `/`. */
function RolePortal() {
  const { roleCode } = useAuthSession()
  return (
    <Suspense fallback={<PortalFallback />}>
      {roleCode === 'ADMIN' ? <AdminPortal /> : roleCode === 'REPORTANTE' ? <ReporterPortal /> : roleCode === 'ANALISTA' ? <AnalystPortal /> : <RolePortalPendingPage />}
    </Suspense>
  )
}

/**
 * Enrutado raíz: /login público y el resto tras la guardia de sesión, que entrega el portal del rol autenticado. El
 * panel de citas (CitationDrawer) y las notificaciones se montan una sola vez en la raíz para que cualquier vista pueda
 * abrir una fuente citada.
 */
function App() {
  const { isAuthenticated } = useAuthSession()
  const drawer = useCitationDrawer()

  return (
    <>
      <Routes>
        <Route element={<GuestOnlyRoute />}>
          <Route path={ROUTE_PATHS.LOGIN} element={<LoginPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path={ROUTE_PATHS.WILDCARD} element={<RolePortal />} />
        </Route>
      </Routes>
      {isAuthenticated && <CitationDrawer isOpen={drawer.isOpen} citation={drawer.activeCitation} onClose={drawer.closeDrawer} />}
      <Toaster position="bottom-right" closeButton toastOptions={{ className: 'font-sans' }} />
    </>
  )
}

export default App
