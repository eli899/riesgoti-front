import { useState } from 'react'
import { Button, Card, EmptyState, Pager, StatusBadge } from '@/components/ui'
import { formatAge, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { monoClassName } from '@/styles/tokens.layout'
import { tableClassName } from '@/styles/tokens.table'
import type { Incident } from '@/types/domain.types'
import { SUPPORT_VIEW_MODES, type SupportViewMode } from '@/constants/ui.constants'
import PriorAISuggestionBadge from './PriorAISuggestionBadge'

const PAGE_SIZE = 10

interface SupportQueueTableProps {
  mode: SupportViewMode
  incidents: Incident[]
  isFiltered: boolean
  onOpen: (id: number) => void
  onReset: () => void
}

/** Bandeja N2 / historial general con la columna "Sugerencia IA previa" (motivo del escalamiento). */
export default function SupportQueueTable({ mode, incidents, isFiltered, onOpen, onReset }: SupportQueueTableProps) {
  const [page, setPage] = useState(1)
  const pages = Math.max(1, Math.ceil(incidents.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const rows = incidents.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  if (incidents.length === 0) {
    return (
      <Card>
        <EmptyState
          title={mode === SUPPORT_VIEW_MODES.QUEUE && !isFiltered ? 'No hay casos en la cola' : 'Sin resultados'}
          text={mode === SUPPORT_VIEW_MODES.QUEUE && !isFiltered ? 'Todas las incidencias derivadas fueron atendidas.' : 'Prueba con otra búsqueda o limpia los filtros.'}
          action={isFiltered ? <Button variant="secondary" onClick={onReset}>Limpiar filtros</Button> : undefined}
        />
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <table className={tableClassName.table}>
        <caption className={tableClassName.caption}>{mode === SUPPORT_VIEW_MODES.QUEUE ? 'Cola de atención humana, más antiguos primero' : 'Incidencias registradas, más recientes primero'} ({incidents.length})</caption>
        <thead className={cn(tableClassName.thead, 'hidden bg-canvas xl:table-header-group')}>
          <tr>
            {['Referencia', 'Título', 'Activo', 'Reportante', 'Estado', 'Antigüedad', 'Sugerencia IA previa'].map((h) => (
              <th key={h} scope="col" className={tableClassName.dense.th}>{h}</th>
            ))}
            <th scope="col" className={tableClassName.dense.th}><span className="sr-only">Acción</span></th>
          </tr>
        </thead>
        <tbody className={tableClassName.tbody}>
          {rows.map((i) => (
            <tr key={i.id} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 p-4 hover:bg-soft xl:table-row xl:p-0">
              <td className={tableClassName.dense.cellXl}><span className={monoClassName}>{i.reference}</span></td>
              <th scope="row" className={cn('col-start-1 max-w-72 font-semibold xl:font-medium', tableClassName.dense.cellXl)}>{i.title}</th>
              <td className={cn('col-start-1 text-xs text-muted xl:text-sm', tableClassName.dense.cellXl)}>{i.assetName ?? 'Activo fuera del catálogo'}</td>
              <td className={cn('col-start-1 text-xs text-muted xl:text-sm', tableClassName.dense.cellXl)}>{i.reporter.name}</td>
              <td className={cn('col-start-2 row-start-1', tableClassName.dense.cellXl)}><StatusBadge status={i.status} /></td>
              <td className={cn('col-start-1 text-xs text-muted xl:text-sm', tableClassName.dense.cellXl)} title={formatDateTime(i.registeredAt)}>
                <span className="xl:hidden">Hace </span>{formatAge(i.registeredAt)}
              </td>
              <td className={cn('col-start-1', tableClassName.dense.cellXl)}><PriorAISuggestionBadge incident={i} /></td>
              <td className={cn(tableClassName.dense.cellXl, 'col-span-2 pt-2 xl:pt-3 xl:text-right')}>
                <Button size="sm" full className="xl:w-auto" variant={mode === SUPPORT_VIEW_MODES.QUEUE ? 'primary' : 'secondary'} onClick={() => onOpen(i.id)} aria-label={`${mode === SUPPORT_VIEW_MODES.QUEUE ? 'Atender' : 'Ver'} ${i.reference}: ${i.title}`}>
                  {mode === SUPPORT_VIEW_MODES.QUEUE ? 'Atender' : 'Ver'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pager page={current} pages={pages} onChange={setPage} />
    </Card>
  )
}
