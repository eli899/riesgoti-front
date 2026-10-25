import { useParams } from 'react-router-dom'
import type { RouteParam } from '@/constants/routes.constants'

const NUMERIC_ID = /^\d+$/

/** Identificador numérico de un parámetro de ruta (`/risks/:riskId`); `null` si falta o no es un entero válido. */
export function useRouteId(param: RouteParam): number | null {
  const raw = useParams()[param]
  return raw !== undefined && NUMERIC_ID.test(raw) ? Number(raw) : null
}
