import { useCallback } from 'react'
import { useLoginMutation } from '@/app/api/authApi'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import {
  logout as logoutAction,
  selectCanEvaluateRisks,
  selectCurrentRole,
  selectCurrentUser,
  selectIsAuthenticated,
  selectUserPermissions,
  setCredentials,
} from '@/features/auth/authSlice'
import { fromApiLoginToDomainSession, fromDomainLoginToApi } from '@/mappers/auth.mapper'
import type { LoginFormValues } from '@/schemas/auth.schema'
import type { AuthSession, PermissionCode } from '@/types/domain.types'

/** Caso de uso de sesión: login JWT, logout y consultas RBAC/SoD del usuario activo. */
export function useAuthSession() {
  const dispatch = useAppDispatch()
  const [loginRequest, { isLoading: isLoggingIn, error: loginError }] = useLoginMutation()

  const currentUser = useAppSelector(selectCurrentUser)
  const roleCode = useAppSelector(selectCurrentRole)
  const permissions = useAppSelector(selectUserPermissions)
  const canEvaluateRisks = useAppSelector(selectCanEvaluateRisks)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  const login = useCallback(
    async (values: LoginFormValues): Promise<AuthSession> => {
      const dto = await loginRequest(fromDomainLoginToApi(values)).unwrap()
      const session = fromApiLoginToDomainSession(dto)
      dispatch(setCredentials(session))
      return session
    },
    [dispatch, loginRequest],
  )

  const logout = useCallback(() => {
    dispatch(logoutAction())
  }, [dispatch])

  const hasPermission = useCallback((code: PermissionCode) => permissions.includes(code), [permissions])

  return { currentUser, roleCode, permissions, canEvaluateRisks, isAuthenticated, hasPermission, login, logout, isLoggingIn, loginError }
}
