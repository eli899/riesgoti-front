import { useRef, useState, type KeyboardEvent } from 'react'
import { RiskLevelBadge } from '@/components/ui'
import { RISK_LEVEL_LABEL } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { MatrixCriterion, RiskLevelCode } from '@/types/domain.types'

interface Matrix5x5EditorGridProps {
  probabilityCriteria: MatrixCriterion[]
  impactCriteria: MatrixCriterion[]
  levelAt: (probability: number, impact: number) => RiskLevelCode | null
  /** Sin onCycle la grilla es de solo lectura. */
  onCycle?: (probability: number, impact: number) => void
  isChanged?: (probability: number, impact: number) => boolean
}

/** Grilla CELDA_MATRIZ 5x5 (probabilidad × impacto) con navegación por teclado (flechas, Inicio, Fin). */
export default function Matrix5x5EditorGrid({ probabilityCriteria, impactCriteria, levelAt, onCycle, isChanged }: Matrix5x5EditorGridProps) {
  const rows = [...probabilityCriteria].sort((a, b) => b.value - a.value)
  const cols = [...impactCriteria].sort((a, b) => a.value - b.value)
  const [focus, setFocus] = useState({ row: 0, col: 0 })
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([])
  const editable = Boolean(onCycle)

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
      <table role="grid" aria-label={`Matriz de riesgo ${rows.length}×${cols.length}: probabilidad por impacto`} aria-readonly={!editable}
        className="w-full min-w-[520px] border-separate border-spacing-1 text-2xs">
        <thead>
          <tr>
            <th scope="col" className="text-left font-medium text-muted">Probabilidad \ Impacto</th>
            {cols.map((c) => (
              <th key={c.value} scope="col" className="font-medium text-muted"><span className="font-mono">{c.value}</span> {c.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((p, r) => (
            <tr key={p.value}>
              <th scope="row" className="text-left font-medium text-muted"><span className="font-mono">{p.value}</span> {p.name}</th>
              {cols.map((i, c) => {
                const level = levelAt(p.value, i.value)
                const changed = isChanged?.(p.value, i.value) ?? false
                const label = `Probabilidad ${p.value} ${p.name}, impacto ${i.value} ${i.name}: ${level ? RISK_LEVEL_LABEL[level] : 'sin nivel'}${changed ? ', modificado' : ''}`
                return (
                  <td key={i.value} role="gridcell" aria-selected={changed || undefined}>
                    <button
                      ref={(el) => { cellRefs.current[r * cols.length + c] = el }}
                      type="button"
                      tabIndex={focus.row === r && focus.col === c ? 0 : -1}
                      aria-label={editable ? `${label}. Pulsa para cambiar el nivel` : label}
                      aria-disabled={!editable || undefined}
                      onFocus={() => setFocus({ row: r, col: c })}
                      onKeyDown={(e) => onKeyDown(e, r, c)}
                      onClick={() => onCycle?.(p.value, i.value)}
                      className={cn('flex min-h-11 w-full items-center justify-center rounded-control border p-1 transition-colors',
                        changed ? 'border-2 border-dashed border-primary bg-soft' : 'border-transparent',
                        editable ? 'cursor-pointer hover:bg-soft' : 'cursor-default')}
                    >
                      <RiskLevelBadge level={level} />
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
