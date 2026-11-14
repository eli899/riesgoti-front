import { CheckCircle2, Layers, Pencil, Power, Trash2 } from 'lucide-react'
import { Button, Card, EmptyState, Switch } from '@/components/ui'
import { cn } from '@/lib/utils'
import { tableClassName } from '@/styles/tokens.table'
import type { AssetType } from '@/types/domain.types'

interface AssetTypesTableProps {
  types: AssetType[]
  canManage: boolean
  togglingId: number | null
  onEdit: (type: AssetType) => void
  onToggleActive: (type: AssetType) => void
  onDelete: (type: AssetType) => void
}

/** Catálogo de TIPO_ACTIVO (CHG-0039). Un tipo en uso solo puede desactivarse; los inactivos no se ofrecen en activos nuevos. */
export default function AssetTypesTable({ types, canManage, togglingId, onEdit, onToggleActive, onDelete }: AssetTypesTableProps) {
  if (types.length === 0) {
    return <Card><EmptyState title="Sin tipos de activo" text="Registra al menos un tipo (por ejemplo, Aplicación o Servidor) antes de crear activos." icon={<Layers size={22} />} /></Card>
  }
  return (
    <Card className="overflow-hidden">
      <table className={tableClassName.table}>
        <caption className={tableClassName.caption}>Tipos de activo</caption>
        <thead className={cn(tableClassName.thead, 'hidden bg-canvas md:table-header-group')}>
          <tr>
            <th scope="col" className={tableClassName.dense.th}>Tipo</th>
            <th scope="col" className={tableClassName.dense.th}>Activos asignados</th>
            <th scope="col" className={tableClassName.dense.th}>Estado</th>
            {canManage && <th scope="col" className={cn(tableClassName.dense.th, 'text-right')}>Acciones</th>}
          </tr>
        </thead>
        <tbody className={tableClassName.tbody}>
          {types.map((t) => (
            <tr key={t.id} className={cn('grid gap-2 p-4 md:table-row md:p-0', !t.active && 'bg-canvas')}>
              <th scope="row" className={cn('font-normal', tableClassName.dense.cellMd)}>
                <span className="flex items-center gap-2 font-semibold"><Layers size={18} className="shrink-0 text-primary" aria-hidden />{t.name}</span>
              </th>
              <td className={cn('text-muted', tableClassName.dense.cellMd)}>
                <span className="md:hidden">Activos asignados: </span>{t.assetCount}
              </td>
              <td className={tableClassName.dense.cellMd}>
                <span className={cn('inline-flex items-center gap-1 text-xs font-semibold', t.active ? 'text-primary-pressed' : 'text-muted')}>
                  {t.active ? <CheckCircle2 size={14} aria-hidden /> : <Power size={14} aria-hidden />}{t.active ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              {canManage && (
                <td className={tableClassName.dense.cellMd}>
                  <span className="flex items-center gap-2 md:justify-end">
                    <Button size="sm" variant="ghost" aria-label={`Editar ${t.name}`} icon={<Pencil size={15} aria-hidden />} onClick={() => onEdit(t)} />
                    <Switch checked={t.active} disabled={togglingId === t.id} label={`${t.active ? 'Desactivar' : 'Activar'} ${t.name}`} onChange={() => onToggleActive(t)} />
                    <Button size="sm" variant="ghost" aria-label={`Eliminar ${t.name}`} icon={<Trash2 size={15} aria-hidden />}
                      disabled={t.assetCount > 0} title={t.assetCount > 0 ? 'En uso: desactívalo en lugar de eliminarlo' : undefined}
                      onClick={() => onDelete(t)} />
                  </span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
