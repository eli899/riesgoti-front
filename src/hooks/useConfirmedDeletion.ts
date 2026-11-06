import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { runMutation } from '@/lib/apiErrors'

interface ConfirmedDeletionOptions<T> {
  /** Mensaje si el servidor no explica el rechazo. */
  fallback: string
  successMessage: (item: T) => string
}

/**
 * Flujo de eliminación física con confirmación: el elemento elegido queda pendiente hasta que se confirma o cancela,
 * y el motivo de un rechazo (409 por dependencias, 403) se conserva para mostrarlo en el diálogo.
 */
export function useConfirmedDeletion<T>(remove: (item: T) => Promise<unknown>, { fallback, successMessage }: ConfirmedDeletionOptions<T>) {
  const [target, setTarget] = useState<T | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const request = useCallback((item: T) => {
    setError(null)
    setTarget(item)
  }, [])

  const cancel = useCallback(() => {
    setError(null)
    setTarget(null)
  }, [])

  /** Devuelve true si se eliminó. */
  const confirm = useCallback(async (): Promise<boolean> => {
    if (target === null) return false
    setIsDeleting(true)
    const { failure } = await runMutation(() => remove(target), fallback)
    setIsDeleting(false)
    if (failure) {
      setError(failure.message)
      return false
    }
    toast.success(successMessage(target))
    setTarget(null)
    return true
  }, [fallback, remove, successMessage, target])

  return { target, request, cancel, confirm, isDeleting, error }
}
