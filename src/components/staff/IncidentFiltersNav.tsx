import { RotateCcw, Search } from 'lucide-react'
import { Button, Field } from '@/components/ui'
import { INCIDENT_STATUS_LABEL } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { AgeFilter, SupportListFilters } from '@/hooks/incidents/useSupportQueue'
import { inputClassName } from '@/styles/tokens.form'
import { cardClassName } from '@/styles/tokens.layout'
import type { Asset, IncidentStatus } from '@/types/domain.types'

interface IncidentFiltersNavProps {
  filters: SupportListFilters
  statuses: IncidentStatus[]
  assets: Asset[]
  isFiltered: boolean
  onChange: (patch: Partial<SupportListFilters>) => void
  onReset: () => void
}

const AGE_OPTIONS: { id: AgeFilter; label: string }[] = [
  { id: 'all', label: 'Cualquiera' },
  { id: '1', label: 'Menos de 1 día' },
  { id: '7', label: 'Menos de 7 días' },
  { id: '30', label: 'Menos de 30 días' },
]

/** Búsqueda y filtros de bandejas de incidencias (estado, activo, antigüedad). */
export default function IncidentFiltersNav({ filters, statuses, assets, isFiltered, onChange, onReset }: IncidentFiltersNavProps) {
  const select = cn(inputClassName(), 'h-11 md:h-10')
  return (
    <search className={cn(cardClassName.base, 'mb-4 block p-4')}>
      <form role="search" aria-label="Filtrar incidencias" onSubmit={(e) => e.preventDefault()} className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:items-end">
        <Field id="flt-q" label="Buscar">
          <span className="relative block">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-control" aria-hidden />
            <input id="flt-q" type="search" value={filters.search} onChange={(e) => onChange({ search: e.target.value })}
              placeholder="INC-0001, título o descripción" className={cn(select, 'pl-10')} />
          </span>
        </Field>
        <Field id="flt-status" label="Estado">
          <select id="flt-status" value={filters.status} onChange={(e) => onChange({ status: e.target.value as SupportListFilters['status'] })} className={select}>
            <option value="all">Todos</option>
            {statuses.map((s) => <option key={s} value={s}>{INCIDENT_STATUS_LABEL[s]}</option>)}
          </select>
        </Field>
        <Field id="flt-asset" label="Activo">
          <select id="flt-asset" value={filters.assetId} onChange={(e) => onChange({ assetId: e.target.value === 'all' ? 'all' : Number(e.target.value) })} className={select}>
            <option value="all">Todos</option>
            {assets.map((a) => <option key={a.id} value={a.id}>{a.name}{a.active ? '' : ' (inactivo)'}</option>)}
          </select>
        </Field>
        <Field id="flt-age" label="Antigüedad">
          <select id="flt-age" value={filters.age} onChange={(e) => onChange({ age: e.target.value as AgeFilter })} className={select}>
            {AGE_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </Field>
        <Button variant="ghost" icon={<RotateCcw size={16} aria-hidden />} disabled={!isFiltered} onClick={onReset}>Limpiar</Button>
      </form>
    </search>
  )
}
