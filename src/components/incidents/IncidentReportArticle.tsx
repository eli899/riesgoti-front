import { Download, FileText, Headset, Paperclip, Wrench } from 'lucide-react'
import { Card, CardHeader, KV } from '@/components/ui'
import { formatDateTime, formatSize } from '@/lib/format'
import { INCIDENT_STATUS_LABEL } from '@/lib/labels'
import type { Evidence, IncidentDetail } from '@/types/domain.types'

/** Avisos de atención humana N2 visibles para el reportante. */
export function HumanAttentionNotice({ incident }: { incident: IncidentDetail }) {
  if (incident.status === 'PENDIENTE_ATENCION_HUMANA' || incident.status === 'EN_ATENCION') {
    const attending = incident.status === 'EN_ATENCION'
    return (
      <Card as="article" className="flex gap-3 p-4">
        <Headset className="shrink-0 text-primary" size={20} aria-hidden />
        <p>
          <strong className="block font-semibold">{attending ? `${incident.attention?.analyst.name ?? 'Un analista'} está atendiendo tu caso` : 'Tu caso está en la cola de atención'}</strong>
          <span className="text-sm text-muted">{attending ? 'La resolución aparecerá aquí cuando se registre.' : 'Un analista revisará tu reporte, las evidencias y los pasos que ya intentaste.'}</span>
        </p>
      </Card>
    )
  }
  if (incident.status === 'CERRADA' && incident.attention?.resolutionNote) {
    return (
      <Card as="article" className="flex gap-3 p-4">
        <Wrench className="shrink-0 text-primary" size={20} aria-hidden />
        <p>
          <strong className="block font-semibold">Resolución de la atención</strong>
          <span className="block whitespace-pre-line text-sm">{incident.attention.resolutionNote}</span>
          {incident.attention.closedAt && <span className="mt-1 block text-xs text-muted">{incident.attention.analyst.name} · {formatDateTime(incident.attention.closedAt)}</span>}
        </p>
      </Card>
    )
  }
  return null
}

/** Reporte original (INCIDENCIA), evidencias (EVIDENCIA_INCIDENCIA) e historial de estados. */
interface IncidentReportArticleProps {
  incident: IncidentDetail
  /** Vista del analista: muestra quién reportó. */
  showReporter?: boolean
  /** Descarga autenticada de evidencias (si se omite, solo se listan). */
  onDownloadEvidence?: (evidence: Evidence) => void
}

export default function IncidentReportArticle({ incident, showReporter = false, onDownloadEvidence }: IncidentReportArticleProps) {
  return (
    <Card as="article" aria-labelledby="original-report-title">
      <CardHeader titleId="original-report-title" title="Reporte original" icon={<FileText size={18} />} />
      <dl className="grid gap-x-4 p-4 md:grid-cols-2 md:p-5">
        <div><KV k="Activo afectado" v={incident.assetName ?? 'No especificado'} /></div>
        <div><KV k="Registrada" v={formatDateTime(incident.registeredAt)} /></div>
        {showReporter && <div><KV k="Reportante" v={incident.reporter.name} /></div>}
        <div className="md:col-span-2"><KV k="Descripción" v={<span className="whitespace-pre-line">{incident.description}</span>} /></div>
      </dl>
      <section aria-labelledby="evidence-title" className="border-t border-line p-4 md:px-5">
        <h3 id="evidence-title" className="mb-2 text-xs font-medium text-muted">Evidencias</h3>
        {incident.evidences.length ? (
          <ul className="space-y-2">
            {incident.evidences.map((e) => (
              <li key={e.id} className="flex items-center gap-2 text-sm">
                <Paperclip size={16} className="shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 truncate">{e.originalName}</span>
                <span className="shrink-0 text-muted">{formatSize(e.bytes)} · {e.mimeType}</span>
                {onDownloadEvidence && (
                  <button type="button" onClick={() => onDownloadEvidence(e)} aria-label={`Descargar ${e.originalName}`}
                    className="ml-auto inline-flex min-h-9 shrink-0 items-center gap-1 rounded-inset px-2 text-xs font-semibold text-primary hover:bg-soft">
                    <Download size={15} aria-hidden />Descargar
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Sin evidencias adjuntas.</p>
        )}
      </section>
      <footer className="border-t border-line p-4 md:px-5">
        <h3 className="mb-2 text-xs font-medium text-muted">Historial de estados</h3>
        <ol className="space-y-2 border-l-2 border-line pl-4">
          {incident.history.map((h) => (
            <li key={h.id} className="text-sm">
              <strong className="font-semibold">{INCIDENT_STATUS_LABEL[h.status]}</strong>
              <span className="text-muted"> · {formatDateTime(h.occurredAt)} · {h.actor.name}</span>
              {h.reason && <span className="block text-xs text-muted">{h.reason}</span>}
            </li>
          ))}
        </ol>
      </footer>
    </Card>
  )
}
