import { useState } from 'react'
import { Plus } from 'lucide-react'
import AsyncContent from '@/components/AsyncContent'
import AssetFormModal from '@/components/admin/AssetFormModal'
import AssetTypeFormModal from '@/components/admin/AssetTypeFormModal'
import AssetTypesTable from '@/components/admin/AssetTypesTable'
import AssetsCatalogTable from '@/components/admin/AssetsCatalogTable'
import ConfirmDeleteDialog from '@/components/forms/ConfirmDeleteDialog'
import PageMeta from '@/components/seo/PageMeta'
import { Button, PageHeader, Tabs } from '@/components/ui'
import { useAssetCatalogManager } from '@/hooks/admin/useAssetCatalogManager'
import { useAssetTypeManager } from '@/hooks/admin/useAssetTypeManager'
import { fromDomainAssetToFormValues } from '@/mappers/admin.mapper'
import type { Asset, AssetType } from '@/types/domain.types'
import { ASSET_TABS, type AssetTab } from '@/constants/ui.constants'

/** Sub-vista: catálogo de activos de información (ACTIVO) y de sus tipos (TIPO_ACTIVO, CHG-0039). */
export default function AssetsPage() {
  const catalog = useAssetCatalogManager()
  const typeManager = useAssetTypeManager()
  const [tab, setTab] = useState<AssetTab>(ASSET_TABS.ASSETS)
  const [editing, setEditing] = useState<{ asset: Asset | null } | null>(null)
  // undefined: diálogo cerrado · null: nuevo tipo · AssetType: edición.
  const [editingType, setEditingType] = useState<AssetType | null | undefined>(undefined)
  const hasActiveTypes = catalog.assetTypes.length > 0

  const headerAction = !catalog.canManage
    ? undefined
    : tab === ASSET_TABS.ASSETS
      ? <Button icon={<Plus size={18} aria-hidden />} disabled={!hasActiveTypes} title={hasActiveTypes ? undefined : 'Primero registra un tipo de activo'} onClick={() => setEditing({ asset: null })}>Nuevo activo</Button>
      : <Button icon={<Plus size={18} aria-hidden />} onClick={() => setEditingType(null)}>Nuevo tipo</Button>

  return (
    <>
      <PageMeta title="Activos — Administración" description="Catálogo de activos de información de RiesgoTI y sus tipos: criticidad y estado." />
      <main id="main-content" className="page-in">
        <PageHeader
          title="Activos"
          sub={catalog.canManage ? 'Catálogo de activos y sus tipos. Los inactivos siguen visibles en los registros históricos.' : 'Modo consulta. Solo un administrador puede modificar el catálogo.'}
          actions={headerAction}
        />
        <Tabs label="Secciones del catálogo" value={tab} onChange={setTab}
          tabs={[{ id: ASSET_TABS.ASSETS, label: 'Activos', count: catalog.assets.length }, { id: ASSET_TABS.TYPES, label: 'Tipos de activo', count: typeManager.types.length }]} />

        {tab === ASSET_TABS.ASSETS && (
          <section aria-label="Catálogo de activos">
            {catalog.canManage && !catalog.isLoading && !hasActiveTypes && (
              <p role="status" className="mb-4 rounded-control border border-mid bg-soft p-3 text-sm text-primary-pressed">
                Para registrar activos primero crea al menos un tipo de activo en la pestaña{' '}
                <button type="button" className="font-semibold underline" onClick={() => setTab(ASSET_TABS.TYPES)}>Tipos de activo</button>.
              </p>
            )}
            <AsyncContent isLoading={catalog.isLoading} error={catalog.loadError} onRetry={catalog.retryLoad} label="el catálogo de activos">
              <AssetsCatalogTable
                assets={catalog.assets}
                canManage={catalog.canManage}
                togglingId={catalog.togglingId}
                onEdit={(asset) => setEditing({ asset })}
                onToggleActive={catalog.toggleActive}
                onDelete={catalog.deletion.request}
              />
            </AsyncContent>
          </section>
        )}

        {tab === ASSET_TABS.TYPES && (
          <section aria-label="Tipos de activo">
            <AsyncContent isLoading={typeManager.isLoading} error={typeManager.loadError} onRetry={typeManager.retryLoad} label="los tipos de activo">
              <AssetTypesTable
                types={typeManager.types}
                canManage={typeManager.canManage}
                togglingId={typeManager.togglingId}
                onEdit={setEditingType}
                onToggleActive={typeManager.toggleActive}
                onDelete={typeManager.deletion.request}
              />
            </AsyncContent>
          </section>
        )}
      </main>

      <ConfirmDeleteDialog
        open={catalog.deletion.target !== null}
        title={`Eliminar ${catalog.deletion.target?.name ?? 'activo'}`}
        isDeleting={catalog.deletion.isDeleting}
        error={catalog.deletion.error}
        onCancel={catalog.deletion.cancel}
        onConfirm={catalog.deletion.confirm}
      >
        <p>El activo se eliminará del catálogo de forma permanente.</p>
        <p className="text-muted">Si alguna incidencia o versión de riesgo lo referencia, no podrá eliminarse: desactívalo para conservar la trazabilidad.</p>
      </ConfirmDeleteDialog>
      <ConfirmDeleteDialog
        open={typeManager.deletion.target !== null}
        title={`Eliminar el tipo ${typeManager.deletion.target?.name ?? ''}`}
        isDeleting={typeManager.deletion.isDeleting}
        error={typeManager.deletion.error}
        onCancel={typeManager.deletion.cancel}
        onConfirm={typeManager.deletion.confirm}
      >
        <p>El tipo de activo se eliminará de forma permanente.</p>
        <p className="text-muted">Si algún activo lo usa, no podrá eliminarse: desactívalo para que no se ofrezca en activos nuevos.</p>
      </ConfirmDeleteDialog>
      <AssetFormModal
        open={editing !== null}
        isNew={editing?.asset === null}
        defaultValues={fromDomainAssetToFormValues(editing?.asset ?? null, catalog.assetTypes[0]?.id)}
        assetTypes={catalog.assetTypes}
        isSaving={catalog.isSaving}
        onClose={() => setEditing(null)}
        onSubmit={(values) => catalog.saveAsset(values, editing?.asset?.id ?? null)}
      />
      <AssetTypeFormModal type={editingType} isSaving={typeManager.isSaving} onClose={() => setEditingType(undefined)} onSubmit={typeManager.saveType} />
    </>
  )
}
