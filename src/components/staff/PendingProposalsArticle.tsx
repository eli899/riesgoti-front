import { GitMerge, Repeat } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui'
import type { RiskVersion } from '@/types/domain.types'

/** Versiones de riesgo propuestas por la IA pendientes de revisión del analista (VERSION_RIESGO.estado = PENDIENTE). */
export default function PendingProposalsArticle({ versions, onOpen }: { versions: RiskVersion[]; onOpen: (versionId: number) => void }) {
  return (
    <Card as="article" aria-labelledby="pending-proposals-title" className="min-w-0">
      <CardHeader titleId="pending-proposals-title" title="Pendientes de revisión" icon={<GitMerge size={18} />}
        action={<span className="rounded-full bg-soft px-2 py-1 text-[11px] font-semibold text-primary-pressed">{versions.length} versiones</span>} />
      {versions.length ? (
        <ul className="divide-y divide-line">
          {versions.slice(0, 5).map((v) => (
            <li key={v.id}>
              <button type="button" onClick={() => onOpen(v.id)} aria-label={`Abrir propuesta ${v.riskCode} v${v.number}: ${v.title}`}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-soft md:px-5">
              <GitMerge size={18} className="shrink-0 text-primary" aria-hidden />
              <p className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">{v.title}</span>
                <span className="block text-[11px] text-muted">
                  <span className="font-mono">{v.riskCode}</span> · v{v.number} · {v.includedIncidentCount} incidencias · {v.origin === 'IA' ? 'Propuesta de IA' : 'Versión del analista'}
                </span>
              </p>
              {v.possibleRecurrence && <span className="inline-flex items-center gap-1 rounded-full bg-mid px-2 py-0.5 text-[11px] font-semibold text-deep"><Repeat size={12} aria-hidden />Recurrencia</span>}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-4 text-[13px] text-muted md:px-5">No hay versiones pendientes de revisión.</p>
      )}
    </Card>
  )
}
