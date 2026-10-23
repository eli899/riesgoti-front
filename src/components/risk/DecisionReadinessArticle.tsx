import { CheckCircle2, Circle, ClipboardCheck } from 'lucide-react'
import { RiskLevelBadge, ValidationBadge } from '@/components/ui'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { RiskVersion } from '@/types/domain.types'

/**
 * Estado de preparación de la versión para la decisión ISO/IEC 27005 (precondiciones de VALIDADA en el backend)
 * o, si ya fue decidida, el registro inmutable de DECISION_RIESGO.
 */
export default function DecisionReadinessArticle({ version }: { version: RiskVersion }) {
  const { decision } = version
  const checks = [
    { done: Boolean(version.confirmedAsset), label: 'Activo afectado confirmado' },
    { done: version.grouping.confirmed, label: 'Agrupación de incidencias confirmada' },
    { done: Boolean(version.evaluation), label: 'Evaluación guardada en la matriz 5×5' },
    { done: version.hasStrategicCitations, label: version.hasStrategicCitations ? 'Fuentes estratégicas citadas' : 'Sin fuentes: requerirá justificación' },
  ]

  return (
    <article aria-labelledby="readiness-heading" className="rounded-[18px] border border-line bg-white p-4 shadow-card md:rounded-[14px]">
      <h2 id="readiness-heading" className="mb-3 flex items-center gap-2 text-[15px] font-semibold"><ClipboardCheck size={18} className="text-primary" aria-hidden />
        {decision ? 'Decisión registrada' : 'Preparación para la decisión'}
      </h2>
      {decision ? (
        <dl className="space-y-2 text-[13px]">
          <span className="flex items-center gap-2"><dt className="sr-only">Acción</dt><dd><ValidationBadge status={decision.action} /></dd></span>
          {decision.observation && <span className="block"><dt className="text-[12px] text-muted">Observación</dt><dd>{decision.observation}</dd></span>}
          {decision.justificationWithoutSources && <span className="block"><dt className="text-[12px] text-muted">Justificación sin fuentes</dt><dd>{decision.justificationWithoutSources}</dd></span>}
          <span className="block"><dt className="sr-only">Registrada por</dt><dd className="text-[12px] text-muted">{decision.analyst.name} · {formatDateTime(decision.decidedAt)}</dd></span>
        </dl>
      ) : (
        <ul className="space-y-2 text-[13px]" aria-label="Requisitos para validar">
          {checks.map((c) => (
            <li key={c.label} className={cn('flex items-start gap-2', !c.done && 'text-muted')}>
              {c.done ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden /> : <Circle size={16} className="mt-0.5 shrink-0" aria-hidden />}
              <span>{c.label}<span className="sr-only">{c.done ? ': completado' : ': pendiente'}</span></span>
            </li>
          ))}
        </ul>
      )}
      {version.evaluation && (
        <p className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3 text-[12px]">
          <span className="text-muted">Nivel evaluado · P{version.evaluation.probability} × I{version.evaluation.impact}</span>
          <RiskLevelBadge level={version.evaluation.levelCode} />
        </p>
      )}
    </article>
  )
}
