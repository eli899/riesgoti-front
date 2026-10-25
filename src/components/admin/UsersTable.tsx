import { Pencil } from 'lucide-react'
import { Avatar, Button, Card, EmptyState, Switch } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { AdminUser } from '@/types/domain.types'

interface UsersTableProps {
  users: AdminUser[]
  currentUserId: number | null
  togglingUserId: number | null
  /** Motivo por el que desactivar al usuario rompería la continuidad administrativa (null si se permite). */
  deactivationBlock: (user: AdminUser) => string | null
  onEdit: (user: AdminUser) => void
  onToggleActive: (user: AdminUser) => void
}

/** Listado de USUARIO con su rol y estado. */
export default function UsersTable({ users, currentUserId, togglingUserId, deactivationBlock, onEdit, onToggleActive }: UsersTableProps) {
  if (users.length === 0) return <Card><EmptyState title="Sin usuarios" text="Crea el primer usuario de la plataforma." /></Card>
  return (
    <Card>
      <ul className="divide-y divide-line" aria-label="Usuarios registrados">
        {users.map((u) => {
          const block = u.active ? deactivationBlock(u) : null
          return (
            <li key={u.id} className={cn('flex flex-wrap items-center gap-3 p-4 md:px-5', !u.active && 'bg-canvas')}>
              <Avatar name={u.fullName} />
              <p className="min-w-0 flex-1">
                <span className="block font-semibold">
                  {u.fullName}{u.id === currentUserId && <span className="ml-2 text-2xs font-normal text-muted">(tú)</span>}
                </span>
                <span className="block truncate text-xs text-muted">{u.email}</span>
              </p>
              <span className="rounded-full bg-soft px-2.5 py-1 text-xs font-semibold text-primary-pressed">{u.roleName}</span>
              <span className={cn('w-16 text-xs font-semibold', u.active ? 'text-primary-pressed' : 'text-muted')}>{u.active ? 'Activo' : 'Inactivo'}</span>
              <Button size="sm" variant="ghost" aria-label={`Editar a ${u.fullName}`} icon={<Pencil size={15} aria-hidden />} onClick={() => onEdit(u)} />
              <span title={block ?? undefined}>
                <Switch checked={u.active} disabled={!!block || togglingUserId === u.id}
                  label={block ? `${u.fullName}: ${block}` : `${u.active ? 'Desactivar' : 'Activar'} a ${u.fullName}`}
                  onChange={() => onToggleActive(u)} />
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
