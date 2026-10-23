import { useState } from 'react'
import { Button, Card, EmptyState, Pager, StatusBadge } from '@/components/ui'
import { formatAge, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Incident } from '@/types/domain.types'
import PriorAISuggestionBadge from './PriorAISuggestionBadge'

const PAGE_SIZE = 10

interface SupportQueueTableProps {
  mode: 'queue' | 'all'
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
          title={mode === 'queue' && !isFiltered ? 'No hay casos en la cola' : 'Sin resultados'}
          text={mode === 'queue' && !isFiltered ? 'Todas las incidencias derivadas fueron atendidas.' : 'Prueba con otra búsqueda o limpia los filtros.'}
          action={isFiltered ? <Button variant="secondary" onClick={onReset}>Limpiar filtros</Button> : undefined}
        />
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-left text-[13.5px]">
        <caption className="sr-only">{mode === 'queue' ? 'Cola de atención humana, más antiguos primero' : 'Incidencias registradas, más recientes primero'} ({incidents.length})</caption>
        <thead className="hidden border-b border-line bg-canvas text-[12px] text-muted xl:table-header-group">
          <tr>
            {['Referencia', 'Título', 'Activo', 'Reportante', 'Estado', 'Antigüedad', 'Sugerencia IA previa'].map((h) => (
              <th key={h} scope="col" className="px-3 py-3 font-medium first:pl-5">{h}</th>
            ))}
            <th scope="col" className="px-3 py-3 pr-5"><span className="sr-only">Acción</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((i) => (
            <tr key={i.id} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 p-4 hover:bg-soft xl:table-row xl:p-0">
              <td className="xl:px-3 xl:py-3 xl:pl-5"><span className="font-mono text-[12.5px] text-primary-pressed">{i.reference}</span></td>
              <th scope="row" className="col-start-1 max-w-72 font-semibold xl:px-3 xl:py-3 xl:font-medium">{i.title}</th>
              <td className="col-start-1 text-[12.5px] text-muted xl:px-3 xl:py-3 xl:text-[13.5px]">{i.assetName ?? 'Activo fuera del catálogo'}</td>
              <td className="col-start-1 text-[12.5px] text-muted xl:px-3 xl:py-3 xl:text-[13.5px]">{i.reporter.name}</td>
              <td className="col-start-2 row-start-1 xl:px-3 xl:py-3"><StatusBadge status={i.status} /></td>
              <td className="col-start-1 text-[12px] text-muted xl:px-3 xl:py-3 xl:text-[13.5px]" title={formatDateTime(i.registeredAt)}>
                <span className="xl:hidden">Hace </span>{formatAge(i.registeredAt)}
              </td>
              <td className="col-start-1 xl:px-3 xl:py-3"><PriorAISuggestionBadge incident={i} /></td>
              <td className={cn('col-span-2 pt-2 xl:px-3 xl:py-3 xl:pr-5 xl:pt-3 xl:text-right')}>
                <Button size="sm" full className="xl:w-auto" variant={mode === 'queue' ? 'primary' : 'secondary'} onClick={() => onOpen(i.id)} aria-label={`${mode === 'queue' ? 'Atender' : 'Ver'} ${i.reference}: ${i.title}`}>
                  {mode === 'queue' ? 'Atender' : 'Ver'}
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
