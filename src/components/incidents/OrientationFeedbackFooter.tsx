import { CheckCircle2, Headset } from 'lucide-react'
import { Button } from '@/components/ui'
import { formatDateTime } from '@/lib/format'
import type { GuidanceResult } from '@/types/domain.types'
import { GUIDANCE_RESULT } from '@/constants/domain.constants'

interface OrientationFeedbackFooterProps {
  response: { result: GuidanceResult; respondedAt: string } | null
  canGiveFeedback: boolean
  isSubmitting: boolean
  onFeedback: (result: GuidanceResult) => void
  audience?: 'reporter' | 'staff'
}

const RESPONSE_COPY = {
  reporter: { FUNCIONO: 'Indicaste que la sugerencia solucionó el problema.', NO_FUNCIONO: 'Indicaste que necesitas atención de un analista.' },
  staff: { FUNCIONO: 'El reportante indicó que la sugerencia solucionó el problema.', NO_FUNCIONO: 'El reportante indicó que los pasos sugeridos no solucionaron el problema.' },
} as const

/** Confirmación del reportante (RESPUESTA_ORIENTACION): inmutable una vez registrada. */
export default function OrientationFeedbackFooter({ response, canGiveFeedback, isSubmitting, onFeedback, audience = 'reporter' }: OrientationFeedbackFooterProps) {
  if (response) {
    const worked = response.result === GUIDANCE_RESULT.FUNCIONO
    return (
      <footer className="flex items-start gap-2 border-t border-line bg-canvas px-4 py-3 text-sm md:px-5">
        {worked ? <CheckCircle2 size={18} className="shrink-0 text-primary" aria-hidden /> : <Headset size={18} className="shrink-0 text-primary" aria-hidden />}
        <p>
          <strong className="block">{RESPONSE_COPY[audience][response.result]}</strong>
          <span className="text-muted">Respuesta registrada el {formatDateTime(response.respondedAt)} · no puede modificarse</span>
        </p>
      </footer>
    )
  }
  if (!canGiveFeedback) return null
  return (
    <footer className="border-t border-line px-4 py-4 md:px-5">
      <fieldset>
        <legend className="mb-3 text-base font-semibold">¿Esta sugerencia solucionó tu problema?</legend>
        <span className="flex flex-col gap-2 sm:flex-row">
          <Button icon={<CheckCircle2 size={18} aria-hidden />} disabled={isSubmitting} onClick={() => onFeedback(GUIDANCE_RESULT.FUNCIONO)}>Sí, funcionó (cerrar incidencia)</Button>
          <Button variant="secondary" icon={<Headset size={18} aria-hidden />} disabled={isSubmitting} onClick={() => onFeedback(GUIDANCE_RESULT.NO_FUNCIONO)}>No funcionó, escalar a un analista</Button>
        </span>
      </fieldset>
    </footer>
  )
}
