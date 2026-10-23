import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface Kpi {
  label: string
  value: ReactNode
  hint: string
  emphasis?: boolean
}

/** Indicadores clave (stat tiles) de los paneles de administración y análisis. */
export default function KpiSection({ kpis, id = 'kpis' }: { kpis: Kpi[]; id?: string }) {
  return (
    <section aria-labelledby={`${id}-title`} className="mb-6">
      <h2 id={`${id}-title`} className="sr-only">Indicadores clave</h2>
      <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map((k) => (
          <li key={k.label}>
            <article className={cn('h-full rounded-[14px] border p-4 shadow-card', k.emphasis ? 'border-primary bg-soft' : 'border-line bg-white')}>
              <h3 className="text-[12.5px] font-medium text-muted">{k.label}</h3>
              <p className="mt-1 text-[26px] font-bold leading-tight tracking-tight">{k.value}</p>
              <p className="mt-1 text-[12px] text-muted">{k.hint}</p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
