import { AlertTriangle, CheckCircle2, Headset, Loader2, RotateCw, ShieldAlert } from 'lucide-react'
import { Button, StatusBadge } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { IncidentDetail } from '@/types/domain.types'

const operationalNote = (incident: IncidentDetail) => {
  if (incident.status !== 'CERRADA') return null
  if (incident.attention?.closedAt) return 'Cerrada por atención humana'
  if (incident.guidanceResult === 'FUNCIONO') return 'Resuelta mediante orientación automática'
  return 'Cerrada'
}

interface OperationalStrategicStatusAsideProps {
  incident: IncidentDetail
  /** Vista del analista: textos técnicos, detalle del error y acciones sobre la rama estratégica. */
  staff?: boolean
  /** Etiqueta raíz: 'aside' en la vista del reportante; 'section' cuando ya vive dentro de un <aside>. */
  as?: 'aside' | 'section'
  canRetry?: boolean
  isRetrying?: boolean
  onRetry?: () => void
  /** Abre el espacio de trabajo de la versión de riesgo vinculada (consola del analista). */
  onOpenRisk?: (versionId: number) => void
}

/**
 * Estado del caso en sus dos ramas independientes (INV-02): la operativa (lo que ve el reportante) y la estratégica
 * (análisis de riesgo), que sigue su curso aunque la incidencia ya esté cerrada.
 */
export default function OperationalStrategicStatusAside({ incident, staff = false, as: As = 'aside', canRetry, isRetrying, onRetry, onOpenRisk }: OperationalStrategicStatusAsideProps) {
  const task = incident.aiTasks.strategic
  const strategic = task?.status ?? 'PENDIENTE'
  const running = strategic === 'PENDIENTE' || strategic === 'PROCESANDO'
  const failed = strategic === 'ERROR'
  const note = operationalNote(incident)
  const strategicLabel = running ? 'En curso' : failed ? (staff ? 'Falló el servicio de análisis' : 'En espera de reproceso') : staff ? 'Propuesta preparada' : 'Completado. Lo revisará un analista.'
  const confirmedLinks = incident.linkedRisks.filter((r) => r.linkStatus !== 'RETIRADA')

  return (
    <As aria-labelledby="case-status-title" className="rounded-[18px] border border-line bg-white p-4 shadow-card md:rounded-[14px] lg:self-start">
      <h2 id="case-status-title" className="mb-3 text-[15px] font-semibold">{staff ? 'Estado operativo y estratégico' : 'Estado del caso'}</h2>
      <dl className="divide-y divide-line overflow-hidden rounded-[12px] border border-line">
        <div className="flex flex-col items-start gap-1.5 p-3">
          <dt className="flex items-center gap-2 text-[13px] font-semibold"><Headset size={16} className="text-primary" aria-hidden />Atención operativa</dt>
          <dd>
            <StatusBadge status={incident.status} />
            {note && <span className="mt-1 block text-[11px] text-muted">{note}</span>}
          </dd>
        </div>
        <div className="flex flex-col items-start gap-1.5 p-3">
          <dt className="flex items-center gap-2 text-[13px] font-semibold"><ShieldAlert size={16} className="text-primary" aria-hidden />Análisis de riesgo</dt>
          <dd aria-live="polite" className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold',
            failed ? 'border-2 border-deep text-deep' : running ? 'bg-soft text-primary' : 'bg-line text-primary-pressed')}>
            {running ? <Loader2 size={14} className="animate-spin" aria-hidden /> : failed ? <AlertTriangle size={14} aria-hidden /> : <CheckCircle2 size={14} aria-hidden />}
            {strategicLabel}
          </dd>
          {staff && task && <dd className="text-[11px] text-muted">Intento {task.attempt}{failed && task.errorCode ? ` · ${task.errorCode}` : ''}</dd>}
        </div>
      </dl>

      {staff && failed && (
        <section className="mt-3 rounded-[12px] border-2 border-deep bg-soft p-3" aria-label="Fallo del análisis de riesgo">
          <p className="text-[13px] font-semibold text-deep">El análisis de riesgo falló</p>
          <p className="mt-1 line-clamp-3 text-[12px] text-muted" title={task?.errorDetail ?? undefined}>
            La incidencia se conservó intacta. {task?.errorDetail ? `Detalle: ${task.errorDetail}` : ''}
          </p>
          {canRetry && onRetry && (
            <Button size="sm" variant="danger" className="mt-3" icon={<RotateCw size={15} aria-hidden />} disabled={isRetrying} onClick={onRetry}>
              {isRetrying ? 'Reintentando…' : 'Reintentar análisis'}
            </Button>
          )}
        </section>
      )}

      {staff ? (
        confirmedLinks.length > 0 && (
          <ul className="mt-3 space-y-1.5" aria-label="Riesgos vinculados">
            {confirmedLinks.map((r) => (
              <li key={r.versionId}>
                {onOpenRisk ? (
                  <button type="button" onClick={() => onOpenRisk(r.versionId)} aria-label={`Ver análisis de riesgo ${r.riskCode} v${r.versionNumber}`}
                    className="flex w-full items-center justify-between gap-2 rounded-[10px] bg-soft px-3 py-2 text-left text-[12px] transition-colors hover:bg-line">
                    <span className="font-semibold text-primary-pressed">Ver análisis de riesgo <span className="font-mono">{r.riskCode}</span> · v{r.versionNumber}</span>
                    <span className="text-muted">{r.linkStatus === 'CONFIRMADA' ? 'Agrupación confirmada' : 'Sugerida por IA'}</span>
                  </button>
                ) : (
                  <p className="flex items-center justify-between gap-2 rounded-[10px] bg-soft px-3 py-2 text-[12px]">
                    <span className="font-semibold text-primary-pressed"><span className="font-mono">{r.riskCode}</span> · v{r.versionNumber}</span>
                    <span className="text-muted">{r.linkStatus === 'CONFIRMADA' ? 'Agrupación confirmada' : 'Sugerida por IA'}</span>
                  </p>
                )}
              </li>
            ))}
          </ul>
        )
      ) : (
        <>
          <p className="mt-3 text-[12px] text-muted">
            Tu respuesta sobre la orientación solo afecta la atención operativa: el análisis de riesgo continúa de forma independiente.
          </p>
          {incident.linkedRisks.some((r) => r.linkStatus === 'CONFIRMADA') && (
            <p className="mt-3 rounded-[10px] bg-soft p-3 text-[12px] text-primary-pressed">
              Tu reporte ayudó a identificar {incident.linkedRisks.filter((r) => r.linkStatus === 'CONFIRMADA').length} riesgo(s) de seguridad.
            </p>
          )}
        </>
      )}
    </As>
  )
}
