import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  useCreateRoleMutation,
  useCreateUserMutation,
  useGetPermissionsQuery,
  useGetRolesQuery,
  useGetUsersQuery,
  useUpdateRoleMutation,
  useUpdateUserMutation,
} from '@/app/api/adminApi'
import { useAuthSession } from '@/hooks/useAuthSession'
import { runMutation, toApiFailure, type ApiFailure, type SubmitResult } from '@/lib/apiErrors'
import {
  fromApiPermissionToDomain,
  fromApiRoleToDomain,
  fromApiUserToDomain,
  fromDomainRoleToApi,
  fromDomainUserToApi,
} from '@/mappers/admin.mapper'
import type { RoleFormValues } from '@/schemas/role.schema'
import type { UserFormValues } from '@/schemas/user.schema'
import type { AdminUser } from '@/types/domain.types'
import { ROLES } from '@/constants/rbac.constants'

/** Caso de uso: usuarios y roles con las reglas de continuidad administrativa y SoD (ISO/IEC 27001 A.5.3). */
export function useUserRoleManager() {
  const { currentUser } = useAuthSession()
  const usersQuery = useGetUsersQuery()
  const rolesQuery = useGetRolesQuery()
  const permissionsQuery = useGetPermissionsQuery()
  const [createUser, { isLoading: isCreatingUser }] = useCreateUserMutation()
  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation()
  const [createRole, { isLoading: isCreatingRole }] = useCreateRoleMutation()
  const [updateRole, { isLoading: isUpdatingRole }] = useUpdateRoleMutation()
  const [togglingUserId, setTogglingUserId] = useState<number | null>(null)

  const users = useMemo(() => (usersQuery.data ?? []).map(fromApiUserToDomain), [usersQuery.data])
  const roles = useMemo(() => (rolesQuery.data ?? []).map(fromApiRoleToDomain), [rolesQuery.data])
  const permissions = useMemo(() => (permissionsQuery.data ?? []).map(fromApiPermissionToDomain), [permissionsQuery.data])
  const activeAdminCount = users.filter((u) => u.roleCode === ROLES.ADMIN && u.active).length

  /** Motivo por el que un usuario no puede perder el acceso administrativo (mismo criterio que UserService). */
  const adminContinuityBlock = useCallback(
    (user: AdminUser, next: { active: boolean; roleId: number }): string | null => {
      const nextRole = roles.find((r) => r.id === next.roleId)
      const leavingAdmin = user.roleCode === ROLES.ADMIN && user.active && (!next.active || nextRole?.code !== ROLES.ADMIN)
      if (!leavingAdmin) return null
      if (user.id === currentUser?.id) return 'No puedes retirarte a ti mismo el acceso administrativo.'
      if (activeAdminCount <= 1) return 'Debe quedar al menos un administrador activo.'
      return null
    },
    [activeAdminCount, currentUser?.id, roles],
  )

  const saveUser = useCallback(
    async (values: UserFormValues, user: AdminUser | null): Promise<SubmitResult> => {
      if (user) {
        const block = adminContinuityBlock(user, { active: values.activo, roleId: values.rol_id })
        if (block) return { status: null, message: block, fieldErrors: { rol_id: block } }
      }
      const body = fromDomainUserToApi(values)
      const { failure } = await runMutation(() => (user ? updateUser({ id: user.id, body }).unwrap() : createUser(body).unwrap()))
      if (failure) return failure
      toast.success(user ? 'Usuario actualizado' : 'Usuario creado')
      return undefined
    },
    [adminContinuityBlock, createUser, updateUser],
  )

  const toggleUserActive = useCallback(
    async (user: AdminUser) => {
      setTogglingUserId(user.id)
      const { failure } = await runMutation(() => updateUser({ id: user.id, body: { activo: !user.active } }).unwrap())
      setTogglingUserId(null)
      if (failure) toast.error('No se pudo cambiar el estado del usuario', { description: failure.message })
      else toast.success(user.active ? 'Usuario desactivado' : 'Usuario activado')
    },
    [updateUser],
  )

  const saveRole = useCallback(
    async (values: RoleFormValues, roleId: number): Promise<SubmitResult> => {
      const { failure } = await runMutation(() => updateRole({ id: roleId, body: fromDomainRoleToApi(values) }).unwrap())
      if (failure) return failure
      toast.success('Permisos del rol actualizados')
      return undefined
    },
    [updateRole],
  )

  /** Crea el rol (sin permisos) y devuelve su id para seleccionarlo a continuación. */
  const createNewRole = useCallback(
    async (values: RoleFormValues): Promise<{ failure?: ApiFailure; roleId?: number }> => {
      const { data, failure } = await runMutation(() => createRole(fromDomainRoleToApi(values)).unwrap())
      if (failure) return { failure }
      toast.success(`Rol ${data!.nombre} creado`, { description: 'Activa ahora los permisos que necesite.' })
      return { roleId: data!.id }
    },
    [createRole],
  )

  const loadError = usersQuery.error ?? rolesQuery.error ?? permissionsQuery.error
  return {
    currentUserId: currentUser?.id ?? null,
    users,
    roles,
    permissions,
    isLoading: usersQuery.isLoading || rolesQuery.isLoading || permissionsQuery.isLoading,
    loadError: loadError ? toApiFailure(loadError).message : null,
    retryLoad: () => {
      usersQuery.refetch()
      rolesQuery.refetch()
      permissionsQuery.refetch()
    },
    adminContinuityBlock,
    saveUser,
    isSavingUser: isCreatingUser || isUpdatingUser,
    toggleUserActive,
    togglingUserId,
    saveRole,
    createNewRole,
    isSavingRole: isCreatingRole || isUpdatingRole,
  }
}
