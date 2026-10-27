import { CheckCircle2, FileQuestion, Loader2, ShieldAlert, ThumbsDown, Unplug } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { Incident } from '@/types/domain.types'
import { AI_TASK_RUNNING_STATUSES, AI_TASK_STATUS, GUIDANCE_RESULT, GUIDANCE_TYPE } from '@/constants/domain.constants'

/** Motivo de llegada a la cola N2: reutiliza el tipo o resultado de la orientación y añade los casos sin orientación. */
const PRIOR_REASON = {
  SENSIBLE: GUIDANCE_TYPE.SENSIBLE,
  SIN_RESPALDO: GUIDANCE_TYPE.SIN_RESPALDO,
  NO_FUNCIONO: GUIDANCE_RESULT.NO_FUNCIONO,
  FUNCIONO: GUIDANCE_RESULT.FUNCIONO,
  FALLO_IA: 'FALLO_IA',
  PENDIENTE: 'PENDIENTE',
  SIN_RESPUESTA: 'SIN_RESPUESTA',
} as const

type PriorReason = (typeof PRIOR_REASON)[keyof typeof PRIOR_REASON]

const REASONS: Record<PriorReason, { label: string; icon: ReactNode; className: string }> = {
  SENSIBLE: { label: 'Escalada por seguridad', icon: <ShieldAlert size={13} aria-hidden />, className: 'bg-deep text-white' },
  SIN_RESPALDO: { label: 'Sin respaldo documental', icon: <FileQuestion size={13} aria-hidden />, className: 'border border-dashed border-control bg-disabled text-muted' },
  NO_FUNCIONO: { label: 'No solucionó', icon: <ThumbsDown size={13} aria-hidden />, className: 'bg-mid text-deep' },
  FUNCIONO: { label: 'Solucionó', icon: <CheckCircle2 size={13} aria-hidden />, className: 'bg-line text-primary-pressed' },
  FALLO_IA: { label: 'Falló el servicio de IA', icon: <Unplug size={13} aria-hidden />, className: 'border-2 border-deep text-deep' },
  PENDIENTE: { label: 'Orientación en curso', icon: <Loader2 size={13} className="animate-spin" aria-hidden />, className: 'bg-soft text-primary' },
  SIN_RESPUESTA: { label: 'Sugerida, sin respuesta', icon: <CheckCircle2 size={13} aria-hidden />, className: 'border border-line bg-white text-muted' },
}

/** Por qué un caso llegó a la cola N2, según la orientación operativa previa (ORIENTACION_OPERATIVA / RESPUESTA_ORIENTACION). */
function priorReasonOf(i: Incident): PriorReason {
  if (i.guidanceType === GUIDANCE_TYPE.SENSIBLE) return PRIOR_REASON.SENSIBLE
  if (i.guidanceType === GUIDANCE_TYPE.SIN_RESPALDO) return PRIOR_REASON.SIN_RESPALDO
  if (i.guidanceResult === GUIDANCE_RESULT.NO_FUNCIONO) return PRIOR_REASON.NO_FUNCIONO
  if (i.guidanceResult === GUIDANCE_RESULT.FUNCIONO) return PRIOR_REASON.FUNCIONO
  if (i.operationalTaskStatus === AI_TASK_STATUS.ERROR) return PRIOR_REASON.FALLO_IA
  if (i.operationalTaskStatus !== null && AI_TASK_RUNNING_STATUSES.includes(i.operationalTaskStatus)) return PRIOR_REASON.PENDIENTE
  return PRIOR_REASON.SIN_RESPUESTA
}

export default function PriorAISuggestionBadge({ incident }: { incident: Incident }) {
  const reason = REASONS[priorReasonOf(incident)]
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-2xs font-semibold', reason.className)}>
      {reason.icon}{reason.label}
    </span>
  )
}
