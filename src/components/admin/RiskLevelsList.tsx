import { Lock } from 'lucide-react'
import { Card, RiskLevelBadge } from '@/components/ui'
import type { RiskLevelCode } from '@/types/domain.types'

/** Catálogo NIVEL_RIESGO en modo consulta (CHG-0039): los 4 códigos son fijos y se cargan con la semilla. */
export default function RiskLevelsList({ levels }: { levels: { id: number; code: RiskLevelCode; order: number }[] }) {
  return (
    <Card aria-label="Niveles de riesgo">
      <p className="flex items-start gap-2 border-b border-line p-4 text-sm text-muted md:px-5">
        <Lock size={16} className="mt-0.5 shrink-0" aria-hidden />
        Los niveles son fijos: la matriz, el tablero y los indicadores dependen de ellos. Se asignan a cada celda en la pestaña Matriz 5×5.
      </p>
      <ol className="divide-y divide-line">
        {[...levels].sort((a, b) => a.order - b.order).map((level) => (
          <li key={level.id} className="flex items-center gap-3 p-4 md:px-5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-soft font-mono font-semibold text-primary" aria-label={`Orden ${level.order}`}>{level.order}</span>
            <RiskLevelBadge level={level.code} />
            <span className="font-mono text-xs text-muted">{level.code}</span>
          </li>
        ))}
      </ol>
    </Card>
  )
}
