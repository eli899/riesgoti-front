import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface Kpi {
  label: string
  value: ReactNode
  hint: string
  emphasis?: boolean
}

/** Franja superior decorativa de cada indicador, rotando los acentos de la paleta; los destacados usan ámbar. */
const KPI_STRIPES = ['bg-primary', 'bg-accent-strong', 'bg-ai', 'bg-success'] as const

/** Indicadores clave (stat tiles) de los paneles de administración y análisis. */
export default function KpiSection({ kpis, id = 'kpis' }: { kpis: Kpi[]; id?: string }) {
  return (
    <section aria-labelledby={`${id}-title`} className="mb-6">
      <h2 id={`${id}-title`} className="sr-only">Indicadores clave</h2>
      <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <li key={k.label}>
            <article className={cn('relative h-full overflow-hidden rounded-card border p-4 pt-5 shadow-card', k.emphasis ? 'border-warning/40 bg-warning-soft' : 'border-line bg-white')}>
              <span aria-hidden className={cn('absolute inset-x-0 top-0 h-1', k.emphasis ? 'bg-warning' : KPI_STRIPES[i % KPI_STRIPES.length])} />
              <h3 className="text-xs font-medium text-muted">{k.label}</h3>
              <p className="mt-1 text-2xl font-bold leading-tight tracking-tight">{k.value}</p>
              <p className="mt-1 text-xs text-muted">{k.hint}</p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
