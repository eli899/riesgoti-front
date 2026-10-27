import { AlertTriangle, CheckCircle2, Circle, Headset, Loader2, ShieldAlert, Sparkles } from 'lucide-react'
import { AIBadge, Card, CardHeader, SectionTitle } from '@/components/ui'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Citation, GuidanceResult, OperationalGuidance } from '@/types/domain.types'
import { AI_TASK_STATUS, GUIDANCE_TYPE } from '@/constants/domain.constants'
import CitationChip, { TextWithCitations } from './CitationChip'
import OrientationFeedbackFooter from './OrientationFeedbackFooter'

interface OperationalGuidanceSectionProps {
  guidance: OperationalGuidance | null
  canGiveFeedback: boolean
  isSubmittingFeedback: boolean
  onFeedback: (result: GuidanceResult) => void
  onInspectCitation: (citation: Citation) => void
  /** 'staff': textos para el Analista N2 (qué recibió el reportante antes del escalamiento). */
  audience?: 'reporter' | 'staff'
}

/** Orientación operativa RAG (ORIENTACION_OPERATIVA + PASO_ORIENTACION + CITA_ORIENTACION) en sus cuatro estados. */
export default function OperationalGuidanceSection({ guidance, canGiveFeedback, isSubmittingFeedback, onFeedback, onInspectCitation, audience = 'reporter' }: OperationalGuidanceSectionProps) {
  const g = guidance?.guidance
  const failed = guidance?.task?.status === AI_TASK_STATUS.ERROR
  const staff = audience === 'staff'

  return (
    <section aria-labelledby="guidance-title" aria-live="polite" aria-busy={guidance?.isPending ?? true}>
      {(!guidance || (guidance.isPending && !g)) && <PendingCard taskStatus={guidance?.task?.status ?? null} />}

      {guidance && !guidance.isPending && (failed || !g || g.type === GUIDANCE_TYPE.SIN_RESPALDO) && (
        <Card as="article" className="flex gap-3 p-4 md:p-5">
          <Headset size={22} className="shrink-0 text-primary" aria-hidden />
          <span>
            <SectionTitle id="guidance-title">
              {staff ? (failed ? 'Sin orientación: falló el servicio de IA' : 'Sin orientación: sin respaldo documental') : 'Tu caso fue derivado a un analista de soporte'}
            </SectionTitle>
            <p className="mt-1 text-base text-muted">
              {staff
                ? failed
                  ? `El reportante no recibió pasos sugeridos (${guidance.task?.errorCode ?? 'error del proveedor'}). Diagnostica el caso desde cero.`
                  : 'Ningún manual operativo autorizado superó el umbral de similitud: el reportante no recibió pasos sugeridos.'
                : <>No se encontró una guía automática aplicable en los manuales vigentes{failed ? ' o el servicio de orientación no respondió' : ''}. Un analista de Soporte TI atenderá tu reporte con las evidencias que adjuntaste.</>}
            </p>
          </span>
        </Card>
      )}

      {g && g.type === GUIDANCE_TYPE.SENSIBLE && (
        <article role="alert" className="rounded-card-mobile border-2 border-deep bg-soft p-5 md:rounded-card">
          <header className="flex items-start gap-3">
            <ShieldAlert className="shrink-0 text-deep" size={22} aria-hidden />
            <span>
              <h2 id="guidance-title" className="text-md font-bold text-deep">
                {staff ? 'Escalada por seguridad: el reportante no recibió pasos técnicos' : 'Posible caso de seguridad: se requiere atención inmediata'}
              </h2>
              {g.summary && <p className="mt-1 text-base">{g.summary}</p>}
            </span>
          </header>
          {g.warning && <p className="mt-3 whitespace-pre-line pl-9 text-sm">{g.warning}</p>}
          <p className="mt-3 pl-9 text-xs text-muted">Por seguridad no se sugieren acciones técnicas. <AIBadge /></p>
        </article>
      )}

      {g && g.type === GUIDANCE_TYPE.SUGERENCIA && (
        <Card as="article" aria-labelledby="guidance-title">
          <CardHeader titleId="guidance-title" title={staff ? 'Historial de orientación IA previa' : 'Sugerencia de solución'} icon={<Sparkles size={18} />} action={<AIBadge />}
            sub={staff ? `Lo que recibió el reportante antes del escalamiento · ${formatDateTime(g.createdAt)}` : `Generada automáticamente · ${formatDateTime(g.createdAt)}`} />
          <section className="space-y-4 p-4 md:p-5">
            {g.summary && <p className="text-base"><TextWithCitations text={g.summary} citations={g.citations} onInspect={onInspectCitation} /></p>}
            {g.warning && (
              <p role="note" className="flex gap-2 rounded-control border border-mid bg-soft p-3 text-sm">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-primary-pressed" aria-hidden />
                <span>{g.warning}</span>
              </p>
            )}
            <ol className="space-y-2" aria-label="Pasos sugeridos">
              {g.steps.map((s) => (
                <li key={s.order}>
                  <article className="flex gap-3 text-base" aria-label={`Paso ${s.order}`}>
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-soft font-mono text-xs font-semibold text-primary" aria-hidden>{s.order}</span>
                    <p className="leading-relaxed"><TextWithCitations text={s.instruction} citations={g.citations} onInspect={onInspectCitation} /></p>
                  </article>
                </li>
              ))}
            </ol>
            {g.citations.length > 0 && (
              <nav aria-label="Fuentes consultadas" className="border-t border-line pt-3">
                <h3 className="mb-2 text-xs font-semibold text-muted">Fuentes consultadas</h3>
                <ul className="flex flex-wrap gap-2">
                  {g.citations.map((c) => <li key={c.number}><CitationChip citation={c} onInspect={onInspectCitation} /></li>)}
                </ul>
              </nav>
            )}
            <p className="text-xs text-muted">Esta orientación se generó a partir de manuales operativos autorizados y solo propone pasos seguros y reversibles.</p>
          </section>
          <OrientationFeedbackFooter response={g.response} canGiveFeedback={canGiveFeedback} isSubmitting={isSubmittingFeedback} onFeedback={onFeedback} audience={audience} />
        </Card>
      )}
    </section>
  )
}

const PENDING_STEPS = ['Reporte registrado', 'Consultando manuales operativos autorizados', 'Preparando la orientación']

function PendingCard({ taskStatus }: { taskStatus: string | null }) {
  const current = taskStatus === AI_TASK_STATUS.PROCESANDO ? 2 : 1
  return (
    <Card as="article" aria-labelledby="guidance-title" className="p-4 md:p-5">
      <SectionTitle id="guidance-title" icon={<Sparkles size={18} className="text-primary" aria-hidden />} className="mb-3">Preparando una orientación para tu caso
      </SectionTitle>
      <ol className="space-y-2">
        {PENDING_STEPS.map((s, i) => {
          const done = i < current
          const active = i === current
          return (
            <li key={s} aria-current={active ? 'step' : undefined} className={cn('flex items-center gap-2 text-sm', done ? 'text-ink' : active ? 'font-semibold text-primary' : 'text-control')}>
              {done ? <CheckCircle2 size={16} className="text-primary" aria-hidden /> : active ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Circle size={16} aria-hidden />}
              {s}
            </li>
          )
        })}
      </ol>
      <p className="mt-3 text-xs text-muted">Suele tardar unos segundos. Puedes salir de esta página: el resultado quedará guardado.</p>
    </Card>
  )
}
