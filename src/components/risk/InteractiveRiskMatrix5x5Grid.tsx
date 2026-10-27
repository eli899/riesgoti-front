import { useRef, useState, type KeyboardEvent } from 'react'
import { Check } from 'lucide-react'
import { RISK_LEVEL_LABEL } from '@/constants/labels.constants'
import { cn } from '@/lib/utils'
import type { MatrixCriterion, RiskLevelCode } from '@/types/domain.types'

const levelCellStyle: Record<RiskLevelCode, string> = {
  BAJO: 'bg-soft text-primary-pressed border-mid',
  MEDIO: 'bg-line text-primary-pressed border-mid',
  ALTO: 'bg-primary text-white border-primary',
  CRITICO: 'bg-deep text-white border-deep',
}

interface InteractiveRiskMatrix5x5GridProps {
  probabilityCriteria: MatrixCriterion[]
  impactCriteria: MatrixCriterion[]
  levelAt: (probability: number, impact: number) => RiskLevelCode | null
  selected: { probability: number; impact: number } | null
  /** Sin onSelect la grilla es de solo lectura. */
  onSelect?: (probability: number, impact: number) => void
}

/**
 * Matriz de evaluación 5x5 (CELDA_MATRIZ): filas de probabilidad (5 a 1) por columnas de impacto (1 a 5).
 * role="grid" con navegación por flechas, Inicio y Fin; la celda elegida se marca con aria-pressed y contorno.
 */
export default function InteractiveRiskMatrix5x5Grid({ probabilityCriteria, impactCriteria, levelAt, selected, onSelect }: InteractiveRiskMatrix5x5GridProps) {
  const rows = [...probabilityCriteria].sort((a, b) => b.value - a.value)
  const cols = [...impactCriteria].sort((a, b) => a.value - b.value)
  const selectedRow = selected ? rows.findIndex((r) => r.value === selected.probability) : -1
  const selectedCol = selected ? cols.findIndex((c) => c.value === selected.impact) : -1
  const [focus, setFocus] = useState({ row: Math.max(selectedRow, 0), col: Math.max(selectedCol, 0) })
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([])
  const interactive = Boolean(onSelect)

  const moveFocus = (row: number, col: number) => {
    const next = { row: Math.max(0, Math.min(rows.length - 1, row)), col: Math.max(0, Math.min(cols.length - 1, col)) }
    setFocus(next)
    cellRefs.current[next.row * cols.length + next.col]?.focus()
  }

  const onKeyDown = (e: KeyboardEvent, row: number, col: number) => {
    const moves: Record<string, [number, number]> = {
      ArrowUp: [row - 1, col], ArrowDown: [row + 1, col], ArrowLeft: [row, col - 1], ArrowRight: [row, col + 1],
      Home: [row, 0], End: [row, cols.length - 1],
    }
    const target = moves[e.key]
    if (!target) return
    e.preventDefault()
    moveFocus(...target)
  }

  return (
    <div className="overflow-x-auto">
      <table role="grid" aria-label="Matriz de riesgo 5×5: probabilidad por impacto" aria-readonly={!interactive}
        className="w-full min-w-[480px] border-separate border-spacing-1 text-2xs">
        <thead>
          <tr role="row">
            <th scope="col" className="w-28 text-left font-medium text-muted">Probabilidad \ Impacto</th>
            {cols.map((c) => <th key={c.value} scope="col" className="font-medium text-muted"><span className="font-mono">I{c.value}</span> {c.name}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((p, r) => (
            <tr key={p.value} role="row">
              <th scope="row" className="text-left font-medium text-muted"><span className="font-mono">P{p.value}</span> {p.name}</th>
              {cols.map((i, c) => {
                const level = levelAt(p.value, i.value)
                const isSelected = selected?.probability === p.value && selected.impact === i.value
                return (
                  <td key={i.value} role="gridcell" aria-selected={isSelected}>
                    <button
                      ref={(el) => { cellRefs.current[r * cols.length + c] = el }}
                      type="button"
                      tabIndex={focus.row === r && focus.col === c ? 0 : -1}
                      aria-pressed={isSelected}
                      aria-disabled={!interactive || undefined}
                      aria-label={`Probabilidad ${p.value} ${p.name}, Impacto ${i.value} ${i.name}, Nivel ${level ? RISK_LEVEL_LABEL[level] : 'sin definir'}`}
                      onFocus={() => setFocus({ row: r, col: c })}
                      onKeyDown={(e) => onKeyDown(e, r, c)}
                      onClick={() => onSelect?.(p.value, i.value)}
                      className={cn('flex min-h-11 w-full items-center justify-center gap-1 rounded-inset border font-semibold transition-shadow',
                        level ? levelCellStyle[level] : 'border-line bg-canvas text-muted',
                        // Selección: contorno ink de 3px. Con foco por teclado pasa al color de foco para distinguirlos.
                        isSelected && 'outline-3 outline-offset-1 outline-ink focus-visible:outline-focus',
                        interactive ? 'cursor-pointer hover:shadow-card' : 'cursor-default')}
                    >
                      {isSelected && <Check size={12} aria-hidden />}{level ? RISK_LEVEL_LABEL[level] : '—'}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
