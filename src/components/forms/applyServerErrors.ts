import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import type { ApiFailure } from '@/lib/apiErrors'
import { FORM_ERROR_KEYS } from '@/constants/ui.constants'

/**
 * Proyecta un ApiFailure (HTTP 400 de DRF) sobre React Hook Form: cada error de campo conocido se asigna a su input
 * y el resto (o el mensaje global) se muestra como error raíz del formulario.
 */
export function applyServerErrors<T extends FieldValues>(failure: ApiFailure, setError: UseFormSetError<T>, knownFields: readonly string[]) {
  let unmatched = false
  for (const [field, message] of Object.entries(failure.fieldErrors)) {
    if (!knownFields.includes(field)) {
      unmatched = true
      continue
    }
    setError(field as Path<T>, { type: 'server', message }, { shouldFocus: true })
  }
  if (unmatched || Object.keys(failure.fieldErrors).length === 0) {
    setError(FORM_ERROR_KEYS.ROOT_SERVER as Path<T>, { type: 'server', message: failure.message })
  }
}
