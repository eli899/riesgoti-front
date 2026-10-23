import { CheckCircle2, Pencil, XCircle } from 'lucide-react'
import { Button } from '@/components/ui'
import type { RiskDecisionAction } from '@/types/domain.types'

interface RiskDecisionActionFooterProps {
  reviewed: boolean
  onReviewedChange: (reviewed: boolean) => void
  validationBlockers: string[]
  onAction: (action: RiskDecisionAction) => void
}

/** Barra fija de decisión ISO/IEC 27005 (Rechazar, Corregir, Validar) del espacio de trabajo de la propuesta. */
export default function RiskDecisionActionFooter({ reviewed, onReviewedChange, validationBlockers, onAction }: RiskDecisionActionFooterProps) {
  const pending = [...validationBlockers, ...(reviewed ? [] : ['Marca el contenido como revisado.'])]
  return (
    <footer aria-label="Acciones de decisión sobre versión de riesgo"
      className="sticky bottom-[max(12px,env(safe-area-inset-bottom))] z-20 mt-4 rounded-[18px] border border-line bg-white/95 p-3 shadow-card backdrop-blur md:rounded-[14px]">
      <section className="flex flex-col gap-3 xl:flex-row xl:items-center" aria-label="Decisión">
        <label className="flex flex-1 items-start gap-2 text-[13px]">
          <input type="checkbox" checked={reviewed} onChange={(e) => onReviewedChange(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-primary" />
          Revisé el contenido, las incidencias y las fuentes.
        </label>
        <span className="grid gap-2 sm:grid-cols-3">
          <Button variant="danger" icon={<XCircle size={18} aria-hidden />} onClick={() => onAction('RECHAZADA')}>Rechazar</Button>
          <Button variant="secondary" icon={<Pencil size={18} aria-hidden />} onClick={() => onAction('CORREGIDA')}>Corregir</Button>
          <Button icon={<CheckCircle2 size={18} aria-hidden />} disabled={pending.length > 0} aria-describedby={pending.length ? 'validate-blockers' : undefined}
            onClick={() => onAction('VALIDADA')}>
            Validar
          </Button>
        </span>
      </section>
      {pending.length > 0 && (
        <p id="validate-blockers" className="mt-2 text-[12px] text-muted">Para validar: {pending.join(' ')}</p>
      )}
    </footer>
  )
}
