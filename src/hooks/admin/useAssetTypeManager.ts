import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useCreateAssetTypeMutation, useDeleteAssetTypeMutation, useGetAssetTypesQuery, useUpdateAssetTypeMutation } from '@/app/api/adminApi'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useConfirmedDeletion } from '@/hooks/useConfirmedDeletion'
import { runMutation, toApiFailure, type SubmitResult } from '@/lib/apiErrors'
import { fromApiAssetTypeToDomain, fromDomainAssetTypeToApi } from '@/mappers/admin.mapper'
import type { AssetTypeFormValues } from '@/schemas/assetType.schema'
import type { AssetType } from '@/types/domain.types'
import { PERMISSIONS } from '@/constants/rbac.constants'

/** Caso de uso: catálogo de TIPO_ACTIVO (alta, edición, activación y eliminación si ningún activo lo usa). CHG-0039. */
export function useAssetTypeManager() {
  const { hasPermission } = useAuthSession()
  const canManage = hasPermission(PERMISSIONS.ASSET_ADMIN)
  const { data, isLoading, error, refetch } = useGetAssetTypesQuery()
  const [createType, { isLoading: isCreating }] = useCreateAssetTypeMutation()
  const [updateType, { isLoading: isUpdating }] = useUpdateAssetTypeMutation()
  const [deleteType] = useDeleteAssetTypeMutation()
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const deletion = useConfirmedDeletion((type: AssetType) => deleteType(type.id).unwrap(), {
    fallback: 'No se pudo eliminar el tipo de activo.',
    successMessage: (type) => `Tipo «${type.name}» eliminado`,
  })

  const types = useMemo(() => (data ?? []).map(fromApiAssetTypeToDomain), [data])

  const saveType = useCallback(
    async (values: AssetTypeFormValues, typeId: number | null): Promise<SubmitResult> => {
      const body = fromDomainAssetTypeToApi(values)
      const { failure } = await runMutation(() =>
        typeId === null ? createType(body).unwrap() : updateType({ id: typeId, body }).unwrap(),
      )
      if (failure) return failure
      toast.success(typeId === null ? 'Tipo de activo registrado' : 'Tipo de activo actualizado')
      return undefined
    },
    [createType, updateType],
  )

  const toggleActive = useCallback(
    async (type: AssetType) => {
      setTogglingId(type.id)
      const { failure } = await runMutation(() => updateType({ id: type.id, body: { activo: !type.active } }).unwrap())
      setTogglingId(null)
      if (failure) toast.error('No se pudo cambiar el estado del tipo', { description: failure.message })
      else toast.success(type.active ? 'Tipo desactivado: ya no se ofrece para activos nuevos' : 'Tipo habilitado')
    },
    [updateType],
  )

  return {
    types,
    canManage,
    isLoading,
    loadError: error ? toApiFailure(error).message : null,
    retryLoad: refetch,
    saveType,
    isSaving: isCreating || isUpdating,
    toggleActive,
    togglingId,
    deletion,
  }
}
