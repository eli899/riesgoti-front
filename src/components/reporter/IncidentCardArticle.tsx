import { ChevronRight, Server } from 'lucide-react'
import { Card, StatusBadge } from '@/components/ui'
import { formatDateTime } from '@/lib/format'
import type { Incident } from '@/types/domain.types'

/** Tarjeta resumida de una INCIDENCIA del reportante. */
export default function IncidentCardArticle({ incident, onOpen }: { incident: Incident; onOpen: (id: number) => void }) {
  return (
    <Card as="article" aria-labelledby={`inc-${incident.id}-title`} className="flex h-full min-h-36 flex-col p-4 shadow-none">
      <header className="flex items-start justify-between gap-3">
        <hgroup className="min-w-0 flex-1">
          <p className="text-[12px] text-muted"><span className="font-mono text-primary-pressed">{incident.reference}</span> · {formatDateTime(incident.registeredAt)}</p>
          <h3 id={`inc-${incident.id}-title`} className="mt-1 truncate text-[15px] font-bold">{incident.title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted"><Server size={15} aria-hidden />{incident.assetName ?? 'Activo no especificado'}</p>
        </hgroup>
        <StatusBadge status={incident.status} />
      </header>
      <footer className="mt-auto pt-3">
        <button type="button" onClick={() => onOpen(incident.id)} aria-label={`Ver detalle de ${incident.reference}: ${incident.title}`}
          className="inline-flex min-h-9 items-center gap-1 rounded-[10px] border border-mid bg-soft px-3 text-[13px] font-semibold text-primary-pressed hover:bg-line">
          Ver detalle <ChevronRight size={16} aria-hidden />
        </button>
      </footer>
    </Card>
  )
}
