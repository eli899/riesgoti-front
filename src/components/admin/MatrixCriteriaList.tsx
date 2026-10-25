import { CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui'
import type { MatrixCriterion } from '@/types/domain.types'

/** Escala vigente de CRITERIO_PROBABILIDAD o CRITERIO_IMPACTO. */
export default function MatrixCriteriaList({ title, criteria }: { title: string; criteria: MatrixCriterion[] }) {
  return (
    <Card aria-label={title}>
      <ol className="divide-y divide-line">
        {[...criteria].sort((a, b) => a.value - b.value).map((c) => (
          <li key={c.value} className="flex items-start gap-3 p-4 md:px-5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-soft font-mono font-semibold text-primary" aria-hidden>{c.value}</span>
            <p className="min-w-0 flex-1">
              <strong className="block font-semibold">{c.value}. {c.name}</strong>
              <span className="block text-sm text-muted">{c.description ?? 'Sin descripción registrada.'}</span>
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-pressed"><CheckCircle2 size={14} aria-hidden />Vigente</span>
          </li>
        ))}
      </ol>
    </Card>
  )
}
