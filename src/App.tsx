import { lazy, Suspense } from 'react'
import { Toaster } from 'sonner'
import CitationDrawer from '@/components/CitationDrawer'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useCitationDrawer } from '@/hooks/useCitationDrawer'
import LoginPage from '@/pages/LoginPage'
import RolePortalPendingPage from '@/pages/RolePortalPendingPage'

// Un fragmento JS por portal: cada rol descarga solo su propio portal.
const AdminPortal = lazy(() => import('@/pages/admin/AdminPortal'))
const AnalystPortal = lazy(() => import('@/pages/staff/AnalystPortal'))
const ReporterPortal = lazy(() => import('@/pages/reporter/ReporterPortal'))

const PortalFallback = () => <p role="status" className="grid min-h-screen place-items-center text-[13px] text-muted">Cargando tu portal…</p>

/**
 * Puerta de sesión: login público y portal según el rol autenticado. El panel de citas (CitationDrawer) y las
 * notificaciones se montan una sola vez en la raíz para que cualquier vista pueda abrir una fuente citada.
 */
function App() {
  const { isAuthenticated, roleCode } = useAuthSession()
  const drawer = useCitationDrawer()

  return (
    <>
      {!isAuthenticated ? <LoginPage /> : (
        <Suspense fallback={<PortalFallback />}>
          {roleCode === 'ADMIN' ? <AdminPortal /> : roleCode === 'REPORTANTE' ? <ReporterPortal /> : roleCode === 'ANALISTA' ? <AnalystPortal /> : <RolePortalPendingPage />}
        </Suspense>
      )}
      {isAuthenticated && <CitationDrawer isOpen={drawer.isOpen} citation={drawer.activeCitation} onClose={drawer.closeDrawer} />}
      <Toaster position="bottom-right" closeButton toastOptions={{ className: 'font-sans' }} />
    </>
  )
}

export default App
