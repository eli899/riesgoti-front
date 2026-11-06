import { useState } from 'react'
import { Plus } from 'lucide-react'
import AsyncContent from '@/components/AsyncContent'
import RoleFormModal from '@/components/admin/RoleFormModal'
import RolePermissionsMatrixView from '@/components/admin/RolePermissionsMatrixView'
import ConfirmDeleteDialog from '@/components/forms/ConfirmDeleteDialog'
import PageMeta from '@/components/seo/PageMeta'
import { Button, PageHeader } from '@/components/ui'
import { useUserRoleManager } from '@/hooks/admin/useUserRoleManager'
import type { RoleFormValues } from '@/schemas/role.schema'

/** Sub-vista: roles y asignación de permisos (ROL / PERMISO / ROL_PERMISO) con Segregación de Funciones. */
export default function RolesPage() {
  const mgr = useUserRoleManager()
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)

  const createRole = async (values: RoleFormValues) => {
    const { failure, roleId } = await mgr.createNewRole(values)
    if (roleId !== undefined) setSelectedRoleId(roleId)
    return failure
  }

  return (
    <>
      <PageMeta title="Roles y permisos — Administración" description="Perfiles de acceso de RiesgoTI y su asignación de permisos con Segregación de Funciones (ISO/IEC 27001)." />
      <main id="main-content" className="page-in">
        <PageHeader title="Roles y permisos" sub="Configura los permisos de cada perfil. Los roles del sistema conservan su código y las reglas de Segregación de Funciones."
          actions={<Button icon={<Plus size={18} aria-hidden />} onClick={() => setCreating(true)}>Nuevo rol</Button>} />
        <AsyncContent isLoading={mgr.isLoading} error={mgr.loadError} onRetry={mgr.retryLoad} label="los roles">
          <RolePermissionsMatrixView
            roles={mgr.roles}
            permissions={mgr.permissions}
            selectedRoleId={selectedRoleId}
            isSaving={mgr.isSavingRole}
            onSelectRole={setSelectedRoleId}
            onSave={mgr.saveRole}
            onDelete={mgr.roleDeletion.request}
          />
        </AsyncContent>
      </main>
      <RoleFormModal open={creating} isSaving={mgr.isSavingRole} onClose={() => setCreating(false)} onSubmit={createRole} />
      <ConfirmDeleteDialog
        open={mgr.roleDeletion.target !== null}
        title={`Eliminar el rol ${mgr.roleDeletion.target?.name ?? ''}`}
        isDeleting={mgr.roleDeletion.isDeleting}
        error={mgr.roleDeletion.error}
        onCancel={mgr.roleDeletion.cancel}
        onConfirm={mgr.roleDeletion.confirm}
      >
        <p>El rol y su asignación de permisos se eliminarán de forma permanente.</p>
        <p className="text-muted">Solo se eliminan roles personalizados sin usuarios asignados; reasigna primero a sus usuarios.</p>
      </ConfirmDeleteDialog>
    </>
  )
}
