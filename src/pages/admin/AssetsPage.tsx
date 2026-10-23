import { useState } from 'react'
import { Plus } from 'lucide-react'
import AsyncContent from '@/components/AsyncContent'
import AssetFormModal from '@/components/admin/AssetFormModal'
import AssetsCatalogTable from '@/components/admin/AssetsCatalogTable'
import PageMeta from '@/components/seo/PageMeta'
import { Button, PageHeader } from '@/components/ui'
import { useAssetCatalogManager } from '@/hooks/admin/useAssetCatalogManager'
import { fromDomainAssetToFormValues } from '@/mappers/admin.mapper'
import type { Asset } from '@/types/domain.types'

/** Sub-vista: catálogo de activos de información (TIPO_ACTIVO / ACTIVO). */
export default function AssetsPage() {
  const catalog = useAssetCatalogManager()
  const [editing, setEditing] = useState<{ asset: Asset | null } | null>(null)

  return (
    <>
      <PageMeta title="Activos — Administración" description="Catálogo de activos de información de RiesgoTI: tipos, criticidad y estado." />
      <main id="main-content" className="page-in">
        <PageHeader
          title="Activos"
          sub={catalog.canManage ? 'Catálogo de activos. Los inactivos siguen visibles en los registros históricos.' : 'Modo consulta. Solo un administrador puede modificar el catálogo.'}
          actions={catalog.canManage && <Button icon={<Plus size={18} aria-hidden />} onClick={() => setEditing({ asset: null })}>Nuevo activo</Button>}
        />
        <section aria-label="Catálogo de activos">
          <AsyncContent isLoading={catalog.isLoading} error={catalog.loadError} onRetry={catalog.retryLoad} label="el catálogo de activos">
            <AssetsCatalogTable
              assets={catalog.assets}
              canManage={catalog.canManage}
              togglingId={catalog.togglingId}
              onEdit={(asset) => setEditing({ asset })}
              onToggleActive={catalog.toggleActive}
            />
          </AsyncContent>
        </section>
      </main>
      <AssetFormModal
        open={editing !== null}
        isNew={editing?.asset === null}
        defaultValues={fromDomainAssetToFormValues(editing?.asset ?? null, catalog.assetTypes[0]?.id)}
        assetTypes={catalog.assetTypes}
        isSaving={catalog.isSaving}
        onClose={() => setEditing(null)}
        onSubmit={(values) => catalog.saveAsset(values, editing?.asset?.id ?? null)}
      />
    </>
  )
}
