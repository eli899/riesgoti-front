import { CheckCircle2, FileQuestion, Loader2, ShieldAlert, ThumbsDown, Unplug } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { Incident } from '@/types/domain.types'

type PriorReason = 'SENSIBLE' | 'SIN_RESPALDO' | 'NO_FUNCIONO' | 'FUNCIONO' | 'FALLO_IA' | 'PENDIENTE' | 'SIN_RESPUESTA'

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
  if (i.guidanceType === 'SENSIBLE') return 'SENSIBLE'
  if (i.guidanceType === 'SIN_RESPALDO') return 'SIN_RESPALDO'
  if (i.guidanceResult === 'NO_FUNCIONO') return 'NO_FUNCIONO'
  if (i.guidanceResult === 'FUNCIONO') return 'FUNCIONO'
  if (i.operationalTaskStatus === 'ERROR') return 'FALLO_IA'
  if (i.operationalTaskStatus === 'PENDIENTE' || i.operationalTaskStatus === 'PROCESANDO') return 'PENDIENTE'
  return 'SIN_RESPUESTA'
}

export default function PriorAISuggestionBadge({ incident }: { incident: Incident }) {
  const reason = REASONS[priorReasonOf(incident)]
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-2xs font-semibold', reason.className)}>
      {reason.icon}{reason.label}
    </span>
  )
}
