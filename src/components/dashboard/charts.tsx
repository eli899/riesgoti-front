import { useState, type ReactNode } from 'react'
import { Card } from '@/components/ui'

/**
 * Gráficos de una sola serie con el color primario del sistema (sin leyenda: el título nombra la serie).
 * Cada gráfico ofrece tooltip al pasar el cursor o enfocar la barra y una tabla equivalente para lectores de pantalla.
 */

interface ChartCardProps {
  id: string
  title: string
  period: string
  summary: string
  children: ReactNode
}

export function ChartCard({ id, title, period, summary, children }: ChartCardProps) {
  return (
    <Card as="article" aria-labelledby={`${id}-title`} className="min-w-0 p-4 md:p-5">
      <header className="mb-4">
        <h3 id={`${id}-title`} className="text-[15px] font-semibold">{title}</h3>
        <p className="text-[12px] text-muted">{period}</p>
      </header>
      {children}
      <p className="sr-only" aria-live="polite">{summary}</p>
    </Card>
  )
}

/** Serie temporal diaria como barras verticales (magnitud por día). */
export function DailyBarChart({ data, unit }: { data: { date: string; total: number }[]; unit: string }) {
  const [active, setActive] = useState<number | null>(null)
  const max = Math.max(1, ...data.map((d) => d.total))
  const label = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })

  return (
    <figure>
      <div className="relative h-40" onMouseLeave={() => setActive(null)}>
        {active !== null && (
          <p role="status" className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 rounded-[8px] bg-ink px-2 py-1 text-[11px] font-medium whitespace-nowrap text-white"
            style={{ left: `${((active + 0.5) / data.length) * 100}%` }}>
            {label(data[active].date)}: {data[active].total} {unit}
          </p>
        )}
        <ol className="flex h-full items-end gap-[2px] border-b border-line" aria-hidden>
          {data.map((d, i) => (
            <li key={d.date} className="flex h-full flex-1 items-end" onMouseEnter={() => setActive(i)}>
              <span className={`block w-full rounded-t-[4px] transition-colors ${active === i ? 'bg-primary-pressed' : 'bg-primary'}`}
                style={{ height: d.total === 0 ? 2 : `${(d.total / max) * 100}%`, opacity: d.total === 0 ? 0.25 : 1 }} />
            </li>
          ))}
        </ol>
      </div>
      <figcaption className="mt-1 flex justify-between text-[11px] text-muted" aria-hidden>
        <span>{label(data[0]?.date ?? '')}</span><span>{label(data[data.length - 1]?.date ?? '')}</span>
      </figcaption>
      <table className="sr-only">
        <caption>Detalle diario</caption>
        <thead><tr><th scope="col">Fecha</th><th scope="col">{unit}</th></tr></thead>
        <tbody>{data.map((d) => <tr key={d.date}><th scope="row">{label(d.date)}</th><td>{d.total}</td></tr>)}</tbody>
      </table>
    </figure>
  )
}

/** Ranking horizontal etiquetado directamente (magnitud por categoría). */
export function HorizontalBars({ data, unit, emptyText }: { data: { label: string; value: number; tag?: ReactNode }[]; unit: string; emptyText: string }) {
  if (data.length === 0) return <p className="text-[13px] text-muted">{emptyText}</p>
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label} title={`${d.label}: ${d.value} ${unit}`}>
          <p className="mb-1 flex items-center justify-between gap-2 text-[12.5px]">
            <span className="flex min-w-0 items-center gap-1.5 truncate font-medium">{d.tag}{d.label}</span>
            <span className="font-semibold">{d.value}<span className="sr-only"> {unit}</span></span>
          </p>
          <span className="block h-2 overflow-hidden rounded-full bg-canvas" aria-hidden>
            <span className="block h-full rounded-full bg-primary" style={{ width: `${(d.value / max) * 100}%` }} />
          </span>
        </li>
      ))}
    </ul>
  )
}
