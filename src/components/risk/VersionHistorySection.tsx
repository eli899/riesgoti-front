import { useState } from 'react'
import { ChevronDown, FileText, GitCompare } from 'lucide-react'
import { Button, Card, KV, RiskLevelBadge, SectionTitle, ValidationBadge } from '@/components/ui'
import { formatDateTime, NOT_DETERMINED } from '@/lib/format'
import { RISK_VERSION_FIELDS } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { RiskVersion } from '@/types/domain.types'
import VersionCompareTable from './VersionCompareTable'

interface VersionHistorySectionProps {
  /** Versiones del riesgo, de la más reciente a la más antigua. */
  versions: RiskVersion[]
  highlightVersionId?: number
  onOpenWorkspace?: (versionId: number) => void
}

/** Historial de VERSION_RIESGO conservado (inmutable) con comparación contra la versión anterior. */
export default function VersionHistorySection({ versions, highlightVersionId, onOpenWorkspace }: VersionHistorySectionProps) {
  const [expanded, setExpanded] = useState<number | null>(null)
  const [comparing, setComparing] = useState<number | null>(null)
  const byId = new Map(versions.map((v) => [v.id, v]))
  const baseOf = (v: RiskVersion) => (v.previousVersionId ? byId.get(v.previousVersionId) : undefined) ?? versions.find((x) => x.number === v.number - 1)

  return (
    <Card aria-labelledby="versions-heading" className="min-w-0">
      <header className="border-b border-line px-4 py-3 md:px-5">
        <SectionTitle id="versions-heading" icon={<FileText size={18} className="text-primary" aria-hidden />}>Versiones</SectionTitle>
        <p className="text-xs text-muted">{versions.length} registros conservados. Las decisiones no modifican versiones anteriores.</p>
      </header>
      <ol className="divide-y divide-line">
        {versions.map((v) => {
          const open = expanded === v.id
          const base = baseOf(v)
          const canCompare = Boolean(base) && (v.origin === 'ANALISTA' || v.number > 1)
          return (
            <li key={v.id} className={cn(highlightVersionId === v.id && 'bg-soft/50')}>
              <button type="button" onClick={() => { setExpanded(open ? null : v.id); setComparing(null) }} aria-expanded={open} aria-controls={`version-${v.id}`}
                className="grid w-full gap-2 p-4 text-left transition-colors hover:bg-soft sm:grid-cols-[90px_120px_1fr_auto] sm:items-center md:px-5">
                <span className="font-semibold">Versión {v.number}</span>
                <ValidationBadge status={v.status} />
                <span className="text-xs text-muted">
                  {v.origin === 'IA' ? 'Origen IA' : `Origen analista · ${v.createdBy.name}`} · {formatDateTime(v.createdAt)}
                  {v.decision && ` · Decidida por ${v.decision.analyst.name}`}
                </span>
                <ChevronDown size={18} className={cn('hidden text-muted transition-transform sm:block', open && 'rotate-180')} aria-hidden />
              </button>
              {open && (
                <article id={`version-${v.id}`} aria-label={`Versión ${v.number}`} className="border-t border-line bg-canvas p-4 md:px-5">
                  <h3 className="mb-3 font-semibold">{v.title}</h3>
                  <dl className="grid gap-x-4 sm:grid-cols-2">
                    {RISK_VERSION_FIELDS.slice(1).map((f) => (
                      <span key={f.key} className={cn('block min-w-0', f.wide && 'sm:col-span-2')}><KV k={f.label} v={<span className="whitespace-pre-line">{v[f.key] || NOT_DETERMINED}</span>} nd={!v[f.key]} /></span>
                    ))}
                    <span className="block"><KV k="Activo confirmado" v={v.confirmedAsset?.name ?? 'Sin confirmar'} nd={!v.confirmedAsset} /></span>
                    <span className="block"><KV k="Evaluación" v={v.evaluation ? <RiskLevelBadge level={v.evaluation.levelCode} /> : 'Sin evaluación'} nd={!v.evaluation} /></span>
                    <span className="block sm:col-span-2">
                      <KV k="Decisión registrada" nd={!v.decision}
                        v={v.decision ? `${v.decision.observation ?? 'Sin observación'} — ${v.decision.analyst.name}, ${formatDateTime(v.decision.decidedAt)}` : 'Sin decisión'} />
                    </span>
                  </dl>
                  <footer className="flex flex-wrap gap-2">
                    {canCompare && (
                      <Button size="sm" variant="secondary" icon={<GitCompare size={16} aria-hidden />} aria-expanded={comparing === v.id}
                        onClick={() => setComparing(comparing === v.id ? null : v.id)}>
                        {comparing === v.id ? 'Ocultar comparación' : 'Comparar con versión anterior'}
                      </Button>
                    )}
                    {onOpenWorkspace && v.status === 'PENDIENTE' && <Button size="sm" onClick={() => onOpenWorkspace(v.id)}>Revisar propuesta v{v.number}</Button>}
                  </footer>
                  {comparing === v.id && base && (
                    <section aria-label={`Comparación v${base.number} y v${v.number}`} className="mt-3 rounded-tile border border-line bg-white p-3">
                      <VersionCompareTable base={base} current={v} />
                    </section>
                  )}
                </article>
              )}
            </li>
          )
        })}
      </ol>
    </Card>
  )
}
