import { CheckCircle2, Pencil, Power, Server } from 'lucide-react'
import { Button, Card, CriticalityBadge, EmptyState, Switch } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { Asset } from '@/types/domain.types'

interface AssetsCatalogTableProps {
  assets: Asset[]
  canManage: boolean
  togglingId: number | null
  onEdit: (asset: Asset) => void
  onToggleActive: (asset: Asset) => void
}

/** Catálogo de ACTIVO. Los inactivos permanecen visibles porque los registros históricos los referencian. */
export default function AssetsCatalogTable({ assets, canManage, togglingId, onEdit, onToggleActive }: AssetsCatalogTableProps) {
  if (assets.length === 0) {
    return <Card><EmptyState title="Sin activos" text="Registra el primer activo del catálogo para que los reportantes puedan seleccionarlo." icon={<Server size={22} />} /></Card>
  }
  return (
    <Card className="overflow-hidden">
      <table className="w-full text-left text-[13px]">
        <caption className="sr-only">Catálogo de activos de información</caption>
        <thead className="hidden border-b border-line bg-canvas text-[12px] text-muted md:table-header-group">
          <tr>
            <th scope="col" className="px-5 py-2 font-medium">Activo</th>
            <th scope="col" className="px-3 py-2 font-medium">Tipo</th>
            <th scope="col" className="px-3 py-2 font-medium">Criticidad</th>
            <th scope="col" className="px-3 py-2 font-medium">Estado</th>
            {canManage && <th scope="col" className="px-5 py-2 text-right font-medium">Acciones</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {assets.map((a) => (
            <tr key={a.id} className={cn('grid gap-2 p-4 md:table-row md:p-0', !a.active && 'bg-canvas')}>
              <th scope="row" className="font-normal md:px-5 md:py-3">
                <span className="flex items-center gap-2 font-semibold"><Server size={18} className="shrink-0 text-primary" aria-hidden />{a.name}</span>
                <span className="font-mono text-[12px] text-muted">{a.code}</span>
              </th>
              <td className="text-muted md:px-3 md:py-3">{a.typeName}</td>
              <td className="md:px-3 md:py-3">{a.criticality ? <CriticalityBadge criticality={a.criticality} /> : <span className="text-[12px] text-muted">Sin criticidad</span>}</td>
              <td className="md:px-3 md:py-3">
                <span className={cn('inline-flex items-center gap-1 text-[12px] font-semibold', a.active ? 'text-primary-pressed' : 'text-muted')}>
                  {a.active ? <CheckCircle2 size={14} aria-hidden /> : <Power size={14} aria-hidden />}{a.active ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              {canManage && (
                <td className="md:px-5 md:py-3">
                  <span className="flex items-center gap-2 md:justify-end">
                    <Button size="sm" variant="ghost" aria-label={`Editar ${a.name}`} icon={<Pencil size={15} aria-hidden />} onClick={() => onEdit(a)} />
                    <Switch checked={a.active} disabled={togglingId === a.id} label={`${a.active ? 'Desactivar' : 'Activar'} ${a.name}`} onChange={() => onToggleActive(a)} />
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
