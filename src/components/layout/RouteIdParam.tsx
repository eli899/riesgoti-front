import type { ReactNode } from 'react'
import type { RouteParam } from '@/constants/routes.constants'
import { useRouteId } from '@/hooks/useRouteId'

/** Entrega el id de la ruta a una página de detalle sin acoplarla al router: la página sigue recibiendo props. */
export default function RouteIdParam({ param, children }: { param: RouteParam; children: (id: number | null) => ReactNode }) {
  const id = useRouteId(param)
  return <>{children(id)}</>
}
