import { useMemo } from 'react'
import { useGetMeQuery } from '@/app/api/authApi'
import { useAuthSession } from '@/hooks/useAuthSession'
import { toApiFailure } from '@/lib/apiErrors'
import { fromApiSessionUserToDomain } from '@/mappers/auth.mapper'

/**
 * Caso de uso: perfil del usuario autenticado (GET /auth/me/) con sus permisos efectivos desde ROL_PERMISO.
 * Mientras carga se muestra el perfil de la sesión.
 */
export function useAccountProfile() {
  const { currentUser } = useAuthSession()
  const query = useGetMeQuery(undefined, { refetchOnMountOrArgChange: true })
  const profile = useMemo(() => (query.data ? fromApiSessionUserToDomain(query.data) : currentUser), [query.data, currentUser])

  return {
    profile,
    isLoading: query.isLoading && !currentUser,
    loadError: query.error ? toApiFailure(query.error).message : null,
    retryLoad: () => query.refetch(),
  }
}
