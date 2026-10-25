import { useState, type ReactNode } from 'react'
import { ChevronDown, GitMerge, Info, MinusCircle, RotateCcw } from 'lucide-react'
import { Button, Card, SectionTitle, StatusBadge } from '@/components/ui'
import { formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { monoClassName } from '@/styles/tokens.layout'
import type { RiskLinkedIncident } from '@/types/domain.types'

const LOW_SIMILARITY = 0.65

interface ClusterIncidentsSectionProps {
  included: RiskLinkedIncident[]
  excluded: RiskLinkedIncident[]
  editable: boolean
  restoringAnalysisId: number | null
  onRequestRemove: (incident: RiskLinkedIncident) => void
  onRestore: (incident: RiskLinkedIncident) => void
}

/**
 * Incidencias vinculadas a la propuesta (VERSION_INCIDENCIA). Muestra abiertas y cerradas: una incidencia cerrada
 * por la orientación sigue aportando evidencia de recurrencia al riesgo (INV-02).
 */
export default function ClusterIncidentsSection({ included, excluded, editable, restoringAnalysisId, onRequestRemove, onRestore }: ClusterIncidentsSectionProps) {
  const [showExcluded, setShowExcluded] = useState(false)
  const closed = included.filter((i) => i.incidentStatus === 'CERRADA').length
  const dates = included.map((i) => i.registeredAt).sort()

  return (
    <Card aria-labelledby="cluster-heading" className="min-w-0">
      <header className="border-b border-line px-4 py-3 md:px-5">
        <SectionTitle id="cluster-heading" icon={<GitMerge size={18} className="text-primary" aria-hidden />}>Incidencias agrupadas ({included.length})</SectionTitle>
        <p className="text-xs text-muted">
          {dates.length ? `Registradas entre ${formatDate(dates[0])} y ${formatDate(dates[dates.length - 1])}` : 'Sin incidencias incluidas'}
          {closed > 0 && ` · ${closed} cerradas que siguen contando como evidencia de recurrencia`}
        </p>
      </header>
      <p className="mx-4 mt-3 flex items-start gap-2 rounded-control bg-canvas p-3 text-xs text-muted md:mx-5">
        <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
        La similitud semántica es un apoyo para la revisión, no una certeza. Retira los falsos positivos indicando el motivo.
      </p>

      {included.length ? (
        <ul className="space-y-2 p-4 md:px-5" aria-label="Incidencias incluidas en la agrupación">
          {included.map((incident) => (
            <li key={incident.analysisId}>
              <LinkedIncidentArticle incident={incident} action={editable && (
                <Button size="sm" variant="ghost" icon={<MinusCircle size={16} aria-hidden />} onClick={() => onRequestRemove(incident)}
                  aria-label={`Retirar ${incident.reference} de la agrupación`}>
                  Retirar de la agrupación
                </Button>
              )} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-4 text-sm text-muted md:px-5">Todas las incidencias fueron retiradas: restaura al menos una para confirmar la agrupación.</p>
      )}

      {excluded.length > 0 && (
        <footer className="border-t border-line px-4 py-3 md:px-5">
          <button type="button" onClick={() => setShowExcluded(!showExcluded)} aria-expanded={showExcluded} aria-controls="excluded-incidents"
            className="flex min-h-11 w-full items-center justify-between text-left text-sm font-semibold text-muted">
            Excluidas de la agrupación ({excluded.length})
            <ChevronDown size={18} className={cn('transition-transform', showExcluded && 'rotate-180')} aria-hidden />
          </button>
          {showExcluded && (
            <ul id="excluded-incidents" className="mt-2 space-y-2" aria-label="Incidencias excluidas de la agrupación">
              {excluded.map((incident) => (
                <li key={incident.analysisId}>
                  <LinkedIncidentArticle incident={incident} excluded action={editable && (
                    <Button size="sm" variant="ghost" icon={<RotateCcw size={16} aria-hidden />} disabled={restoringAnalysisId === incident.analysisId}
                      onClick={() => onRestore(incident)} aria-label={`Restaurar ${incident.reference} a la agrupación`}>
                      {restoringAnalysisId === incident.analysisId ? 'Restaurando…' : 'Restaurar'}
                    </Button>
                  )} />
                </li>
              ))}
            </ul>
          )}
        </footer>
      )}
    </Card>
  )
}

function LinkedIncidentArticle({ incident, excluded, action }: { incident: RiskLinkedIncident; excluded?: boolean; action?: ReactNode }) {
  const titleId = `linked-${incident.analysisId}-title`
  const low = incident.similarity !== null && incident.similarity < LOW_SIMILARITY
  return (
    <article aria-labelledby={titleId} className={cn('rounded-tile border p-3', excluded ? 'border-dashed border-control bg-canvas' : low ? 'border-mid bg-soft/40' : 'border-line bg-white')}>
      <header className="flex flex-wrap items-center gap-2">
        <span className={monoClassName}>{incident.reference}</span>
        <time dateTime={incident.registeredAt} className="text-2xs text-muted">{formatDate(incident.registeredAt)}</time>
        {incident.similarity !== null && (
          <span className={cn('rounded-full px-2 py-0.5 text-2xs font-semibold', low ? 'bg-mid text-deep' : 'bg-soft text-primary-pressed')}>
            Similitud {(incident.similarity * 100).toFixed(1)}%
          </span>
        )}
        {incident.incidentStatus && <StatusBadge status={incident.incidentStatus} />}
      </header>
      <h3 id={titleId} className="mt-1 text-sm font-semibold">{incident.title}</h3>
      <p className="text-xs text-muted">Activo reportado: {incident.assetName ?? 'Fuera del catálogo'}</p>
      {low && !excluded && <p className="mt-1 text-xs font-medium text-deep">Similitud baja: revisa si es un falso positivo.</p>}

      <details className="group mt-2 text-xs">
        <summary className="flex min-h-9 cursor-pointer list-none items-center gap-1 font-medium text-primary-hover">
          <ChevronDown size={14} className="transition-transform group-open:rotate-180" aria-hidden />Extracto y motivo de la similitud
        </summary>
        <dl className="mt-1 space-y-2 rounded-control bg-canvas p-3">
          <span className="block"><dt className="font-semibold">Extracto del reporte</dt><dd className="text-muted">{incident.reportExcerpt ? `«${incident.reportExcerpt}»` : 'Sin extracto'}</dd></span>
          <span className="block"><dt className="font-semibold">Motivo de la similitud</dt><dd className="text-muted">{incident.similarityReason ?? 'Sin explicación registrada'}</dd></span>
        </dl>
      </details>

      {excluded && incident.removalReason && (
        <p className="mt-2 rounded-control border border-line bg-white p-2 text-xs">
          <strong>Motivo del retiro:</strong> {incident.removalReason}
          {incident.reviewedByName && <span className="block text-muted">{incident.reviewedByName}{incident.reviewedAt && ` · ${formatDateTime(incident.reviewedAt)}`}</span>}
        </p>
      )}
      {action && <footer className="mt-2 flex justify-end">{action}</footer>}
    </article>
  )
}
