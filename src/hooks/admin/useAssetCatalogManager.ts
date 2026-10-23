import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useCreateAssetMutation, useGetAssetsQuery, useGetAssetTypesQuery, useUpdateAssetMutation } from '@/app/api/adminApi'
import { useAuthSession } from '@/hooks/useAuthSession'
import { runMutation, toApiFailure, type SubmitResult } from '@/lib/apiErrors'
import { fromApiAssetToDomain, fromApiAssetTypeToDomain, fromDomainAssetToApi } from '@/mappers/admin.mapper'
import type { AssetFormValues } from '@/schemas/asset.schema'
import type { Asset } from '@/types/domain.types'

/** Caso de uso: catálogo de ACTIVO (alta, edición y activación; nunca se elimina). */
export function useAssetCatalogManager() {
  const { hasPermission } = useAuthSession()
  const canManage = hasPermission('activo.administrar')
  const assetsQuery = useGetAssetsQuery()
  const typesQuery = useGetAssetTypesQuery()
  const [createAsset, { isLoading: isCreating }] = useCreateAssetMutation()
  const [updateAsset, { isLoading: isUpdating }] = useUpdateAssetMutation()
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const assets = useMemo(() => (assetsQuery.data ?? []).map(fromApiAssetToDomain), [assetsQuery.data])
  const assetTypes = useMemo(() => (typesQuery.data ?? []).map(fromApiAssetTypeToDomain).filter((t) => t.active), [typesQuery.data])

  const saveAsset = useCallback(
    async (values: AssetFormValues, assetId: number | null): Promise<SubmitResult> => {
      const body = fromDomainAssetToApi(values)
      const { failure } = await runMutation(() =>
        assetId === null ? createAsset(body).unwrap() : updateAsset({ id: assetId, body }).unwrap(),
      )
      if (failure) return failure
      toast.success(assetId === null ? 'Activo registrado' : 'Activo actualizado')
      return undefined
    },
    [createAsset, updateAsset],
  )

  const toggleActive = useCallback(
    async (asset: Asset) => {
      setTogglingId(asset.id)
      const { failure } = await runMutation(() => updateAsset({ id: asset.id, body: { activo: !asset.active } }).unwrap())
      setTogglingId(null)
      if (failure) toast.error('No se pudo cambiar el estado del activo', { description: failure.message })
      else toast.success(asset.active ? 'Activo desactivado: sigue visible en registros históricos' : 'Activo habilitado')
    },
    [updateAsset],
  )

  const loadError = assetsQuery.error ?? typesQuery.error
  return {
    assets,
    assetTypes,
    canManage,
    isLoading: assetsQuery.isLoading || typesQuery.isLoading,
    loadError: loadError ? toApiFailure(loadError).message : null,
    retryLoad: () => {
      assetsQuery.refetch()
      typesQuery.refetch()
    },
    saveAsset,
    isSaving: isCreating || isUpdating,
    toggleActive,
    togglingId,
  }
}
