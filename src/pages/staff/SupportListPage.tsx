import { RefreshCw } from 'lucide-react'
import AsyncContent from '@/components/AsyncContent'
import PageMeta from '@/components/seo/PageMeta'
import IncidentFiltersNav from '@/components/staff/IncidentFiltersNav'
import SupportQueueTable from '@/components/staff/SupportQueueTable'
import { PageHeader } from '@/components/ui'
import { useSupportQueue, type SupportListMode } from '@/hooks/incidents/useSupportQueue'
import type { IncidentStatus } from '@/types/domain.types'
import { INCIDENT_HUMAN_QUEUE_STATUSES, INCIDENT_STATUS } from '@/constants/domain.constants'
import { SUPPORT_VIEW_MODES } from '@/constants/ui.constants'

const ALL_STATUSES: readonly IncidentStatus[] = Object.values(INCIDENT_STATUS)
const MODE_COPY: Record<SupportListMode, { title: string; sub: string; meta: string; description: string }> = {
  queue: {
    title: 'Atención de incidencias',
    sub: 'Casos que requieren atención humana, los más antiguos primero. El cierre operativo no decide el riesgo asociado.',
    meta: 'Atención de incidencias — Consola Analista N2',
    description: 'Cola de incidencias derivadas a atención humana N2 con el motivo del escalamiento.',
  },
  all: {
    title: 'Incidencias',
    sub: 'Todas las incidencias registradas, las más recientes primero.',
    meta: 'Incidencias — Consola Analista N2',
    description: 'Historial general de incidencias con filtros por estado, activo y antigüedad.',
  },
}

/** Página contenedora de la cola N2 (SupportQueue) y del historial general (AllIncidents). */
export default function SupportListPage({ mode, onOpen }: { mode: SupportListMode; onOpen: (id: number) => void }) {
  const list = useSupportQueue(mode)
  const copy = MODE_COPY[mode]

  return (
    <>
      <PageMeta title={copy.meta} description={copy.description} />
      <main id="main-content" className="page-in">
        <PageHeader title={copy.title} sub={copy.sub}
          actions={list.isRefreshing && <span role="status" className="inline-flex items-center gap-1.5 text-xs text-muted"><RefreshCw size={14} className="animate-spin" aria-hidden />Actualizando</span>} />
        <IncidentFiltersNav
          filters={list.filters}
          statuses={mode === SUPPORT_VIEW_MODES.QUEUE ? INCIDENT_HUMAN_QUEUE_STATUSES : ALL_STATUSES}
          assets={list.assets}
          isFiltered={list.isFiltered}
          onChange={list.updateFilters}
          onReset={list.resetFilters}
        />
        <section aria-label={mode === SUPPORT_VIEW_MODES.QUEUE ? 'Cola de atención' : 'Listado de incidencias'}>
          <AsyncContent isLoading={list.isLoading} error={list.loadError} onRetry={list.retryLoad} label="las incidencias">
            <SupportQueueTable key={JSON.stringify(list.filters)} mode={mode} incidents={list.incidents} isFiltered={list.isFiltered} onOpen={onOpen} onReset={list.resetFilters} />
          </AsyncContent>
        </section>
      </main>
    </>
  )
}
