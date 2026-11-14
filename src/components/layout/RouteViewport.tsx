import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Área de contenido enrutada: cada ruta monta su vista desde cero (sin estado local arrastrado entre detalles) y la
 * navegación vuelve al inicio de la página.
 */
export default function RouteViewport({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 })
  }, [pathname])
  return <div key={pathname} className="min-w-0 w-full">{children}</div>
}
