import { useMemo, useState } from 'react'
import { ChevronRight, Search } from 'lucide-react'
import { Button, Card, Chips, EmptyState, Pager, StatusBadge } from '@/components/ui'
import { formatDate } from '@/lib/format'
import { INCIDENT_STATUS_LABEL } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { inputClassName } from '@/styles/tokens.form'
import { monoClassName } from '@/styles/tokens.layout'
import { tableClassName } from '@/styles/tokens.table'
import type { Incident, IncidentStatus } from '@/types/domain.types'

const PAGE_SIZE = 8
type StatusFilter = 'all' | IncidentStatus

/** Bandeja de incidencias propias con búsqueda, filtro por estado, orden por fecha y paginación. */
export default function IncidentsTable({ incidents, onOpen }: { incidents: Incident[]; onOpen: (id: number) => void }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [ascending, setAscending] = useState(false)
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return incidents
      .filter((i) => status === 'all' || i.status === status)
      .filter((i) => !term || `${i.reference} ${i.title} ${i.description}`.toLowerCase().includes(term))
      .sort((a, b) => (ascending ? 1 : -1) * (new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime()))
  }, [incidents, query, status, ascending])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const reset = () => { setQuery(''); setStatus('all'); setPage(1) }

  return (
    <>
      <search className="mb-4 block space-y-3">
        <p className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-control" aria-hidden />
          <input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} aria-label="Buscar por referencia, título o descripción"
            placeholder="Buscar por referencia, título o descripción" className={cn(inputClassName(), 'h-11 pl-10 md:h-10')} />
        </p>
        <Chips label="Filtrar por estado" value={status} onChange={(v) => { setStatus(v); setPage(1) }}
          items={[{ id: 'all', label: 'Todas' }, ...(Object.keys(INCIDENT_STATUS_LABEL) as IncidentStatus[]).map((id) => ({ id, label: INCIDENT_STATUS_LABEL[id] }))]} />
      </search>

      <Card>
        {rows.length === 0 ? (
          <EmptyState title={incidents.length ? 'Sin resultados' : 'Aún no tienes reportes'}
            text={incidents.length ? 'No hay incidencias que coincidan con la búsqueda o el filtro.' : 'Cuando registres una incidencia aparecerá aquí.'}
            action={incidents.length ? <Button variant="secondary" onClick={reset}>Limpiar filtros</Button> : undefined} />
        ) : (
          <>
            <table className={cn(tableClassName.table, 'text-base')}>
              <caption className={tableClassName.caption}>Mis incidencias ({filtered.length})</caption>
              <thead className={cn(tableClassName.thead, 'hidden lg:table-header-group')}>
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Referencia</th>
                  <th scope="col" className="py-3 font-medium">Título</th>
                  <th scope="col" className="py-3 font-medium">Activo</th>
                  <th scope="col" className="py-3 font-medium">Estado</th>
                  <th scope="col" className="py-3 pr-5 font-medium" aria-sort={ascending ? 'ascending' : 'descending'}>
                    <button type="button" onClick={() => setAscending(!ascending)} className="font-medium hover:text-primary">Fecha {ascending ? '↑' : '↓'}</button>
                  </th>
                </tr>
              </thead>
              <tbody className={tableClassName.tbody}>
                {rows.map((i) => (
                  <tr key={i.id} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 px-4 py-3 hover:bg-soft lg:table-row lg:p-0">
                    <td className="lg:px-5 lg:py-3">
                      <button type="button" onClick={() => onOpen(i.id)} className={cn(monoClassName, 'hover:underline')} aria-label={`Abrir ${i.reference}: ${i.title}`}>{i.reference}</button>
                      <span className="ml-2 text-xs text-muted lg:hidden">{formatDate(i.registeredAt)}</span>
                    </td>
                    <td className="col-start-1 font-medium lg:py-3">{i.title}</td>
                    <td className="col-start-1 text-sm text-muted lg:py-3">{i.assetName ?? 'Activo no especificado'}</td>
                    <td className="col-start-2 row-span-3 row-start-1 self-center lg:py-3">
                      <span className="flex items-center gap-2"><StatusBadge status={i.status} /><ChevronRight size={18} className="text-control lg:hidden" aria-hidden /></span>
                    </td>
                    <td className="hidden pr-5 text-muted lg:table-cell lg:py-3">{formatDate(i.registeredAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pager page={current} pages={pages} onChange={setPage} />
          </>
        )}
      </Card>
    </>
  )
}
