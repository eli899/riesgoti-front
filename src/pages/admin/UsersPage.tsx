import { useState } from 'react'
import { Plus } from 'lucide-react'
import AsyncContent from '@/components/AsyncContent'
import UserFormModal from '@/components/admin/UserFormModal'
import UsersTable from '@/components/admin/UsersTable'
import ConfirmDeleteDialog from '@/components/forms/ConfirmDeleteDialog'
import PageMeta from '@/components/seo/PageMeta'
import { Button, PageHeader } from '@/components/ui'
import { useUserRoleManager } from '@/hooks/admin/useUserRoleManager'
import { fromDomainUserToFormValues } from '@/mappers/admin.mapper'
import type { AdminUser } from '@/types/domain.types'
import { ROLES } from '@/constants/rbac.constants'

/** Sub-vista: usuarios de la plataforma (USUARIO). */
export default function UsersPage() {
  const mgr = useUserRoleManager()
  const [editing, setEditing] = useState<{ user: AdminUser | null } | null>(null)
  const defaultRoleId = mgr.roles.find((r) => r.code === ROLES.REPORTANTE)?.id ?? mgr.roles[0]?.id

  return (
    <>
      <PageMeta title="Usuarios — Administración" description="Alta, edición, asignación de rol y activación de los usuarios de RiesgoTI." />
      <main id="main-content" className="page-in">
        <PageHeader title="Usuarios" sub="Cada usuario tiene un único rol. Un usuario con actividad registrada se desactiva; solo se eliminan los que no tienen registros."
          actions={<Button icon={<Plus size={18} aria-hidden />} onClick={() => setEditing({ user: null })}>Nuevo usuario</Button>} />
        <section aria-label="Usuarios registrados">
          <AsyncContent isLoading={mgr.isLoading} error={mgr.loadError} onRetry={mgr.retryLoad} label="los usuarios">
            <UsersTable
              users={mgr.users}
              currentUserId={mgr.currentUserId}
              togglingUserId={mgr.togglingUserId}
              deactivationBlock={(u) => mgr.adminContinuityBlock(u, { active: false, roleId: u.roleId })}
              onEdit={(user) => setEditing({ user })}
              onToggleActive={mgr.toggleUserActive}
              onDelete={mgr.userDeletion.request}
            />
            <p className="mt-3 text-xs text-muted">No se puede desactivar al último administrador activo ni retirarte tu propio acceso administrativo.</p>
          </AsyncContent>
        </section>
      </main>
      <UserFormModal
        open={editing !== null}
        isNew={editing?.user === null}
        defaultValues={fromDomainUserToFormValues(editing?.user ?? null, defaultRoleId)}
        roles={mgr.roles}
        isSaving={mgr.isSavingUser}
        onClose={() => setEditing(null)}
        onSubmit={(values) => mgr.saveUser(values, editing?.user ?? null)}
      />
      <ConfirmDeleteDialog
        open={mgr.userDeletion.target !== null}
        title={`Eliminar a ${mgr.userDeletion.target?.fullName ?? 'usuario'}`}
        isDeleting={mgr.userDeletion.isDeleting}
        error={mgr.userDeletion.error}
        onCancel={mgr.userDeletion.cancel}
        onConfirm={mgr.userDeletion.confirm}
      >
        <p>La cuenta {mgr.userDeletion.target?.email} se eliminará de forma permanente.</p>
        <p className="text-muted">Si el usuario registró incidencias, atenciones, evaluaciones, decisiones o documentos, no podrá eliminarse: desactívalo para conservar la trazabilidad.</p>
      </ConfirmDeleteDialog>
    </>
  )
}
