import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes.constants'
import { useAuthSession } from '@/hooks/useAuthSession'

/** Estado de navegación que conserva la ruta solicitada antes de exigir el inicio de sesión. */
interface LoginRedirectState {
  from: string
}

const isLoginRedirectState = (state: unknown): state is LoginRedirectState =>
  typeof state === 'object' && state !== null && 'from' in state && typeof state.from === 'string'

/** Guardia de sesión: sin JWT redirige a /login recordando la ruta pedida para volver a ella tras autenticarse. */
export function ProtectedRoute() {
  const { isAuthenticated } = useAuthSession()
  const location = useLocation()

  if (!isAuthenticated) {
    const state: LoginRedirectState = { from: `${location.pathname}${location.search}` }
    return <Navigate replace to={ROUTES.LOGIN} state={state} />
  }
  return <Outlet />
}

/** Rutas públicas (login): con sesión activa se vuelve a la ruta pedida o al inicio del portal del rol. */
export function GuestOnlyRoute() {
  const { isAuthenticated } = useAuthSession()
  const { state } = useLocation()

  if (isAuthenticated) {
    const from = isLoginRedirectState(state) && state.from !== ROUTES.LOGIN ? state.from : ROUTES.ROOT
    return <Navigate replace to={from} />
  }
  return <Outlet />
}
