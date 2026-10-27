import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import { FORM_ERROR_KEYS } from '@/constants/ui.constants'

/** Error de API normalizado para la UI: mensaje global + errores por campo (formato DRF). */
export interface ApiFailure {
  status: number | null
  message: string
  fieldErrors: Record<string, string>
}

const STATUS_MESSAGES: Record<number, string> = {
  401: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'El recurso solicitado no existe.',
  413: 'El archivo supera el tamaño permitido.',
}

const firstMessage = (value: unknown): string | null => {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return firstMessage(value[0])
  if (value && typeof value === 'object') return firstMessage(Object.values(value)[0])
  return null
}

function isFetchError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error !== null && 'status' in error
}

/** Convierte cualquier error de RTK Query / unwrap() en un ApiFailure legible. */
export function toApiFailure(error: unknown, fallback: string = 'No se pudo completar la operación.'): ApiFailure {
  if (!isFetchError(error)) {
    return { status: null, message: (error as SerializedError | undefined)?.message ?? fallback, fieldErrors: {} }
  }
  if (typeof error.status !== 'number') {
    return { status: null, message: 'No se pudo conectar con el servidor. Verifica tu conexión.', fieldErrors: {} }
  }

  const fieldErrors: Record<string, string> = {}
  let message: string | null = null
  const data = error.data
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const text = firstMessage(value)
      if (!text) continue
      if (key === FORM_ERROR_KEYS.DETAIL || key === FORM_ERROR_KEYS.NON_FIELD_ERRORS) message ??= text
      else fieldErrors[key] = text
    }
  } else {
    message = firstMessage(data)
  }

  message ??= Object.values(fieldErrors)[0] ?? STATUS_MESSAGES[error.status] ?? fallback
  return { status: error.status, message, fieldErrors }
}

/** Resultado de una acción de formulario: undefined si tuvo éxito, o el fallo normalizado. */
export type SubmitResult = ApiFailure | undefined

/** Ejecuta una mutación y devuelve el fallo normalizado en lugar de lanzar. */
export async function runMutation<T>(action: () => Promise<T>, fallback?: string): Promise<{ data?: T; failure?: ApiFailure }> {
  try {
    return { data: await action() }
  } catch (error) {
    return { failure: toApiFailure(error, fallback) }
  }
}
