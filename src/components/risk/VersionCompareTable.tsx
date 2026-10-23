import { Pencil } from 'lucide-react'
import { NOT_DETERMINED } from '@/lib/format'
import { RISK_VERSION_FIELDS } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { RiskVersion } from '@/types/domain.types'

/** Comparación lado a lado «Antes · v{base}» / «Después · v{actual}»: tacha el valor previo y resalta los cambios. */
export default function VersionCompareTable({ base, current }: { base: RiskVersion; current: RiskVersion }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-[13px]">
        <caption className="sr-only">Comparación de la versión {current.number} con la versión {base.number}</caption>
        <thead>
          <tr className="text-[12px] text-muted">
            <th scope="col" className="w-36 py-2 font-medium">Campo</th>
            <th scope="col" className="py-2 font-medium">Antes · v{base.number}</th>
            <th scope="col" className="py-2 font-medium">Después · v{current.number}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {RISK_VERSION_FIELDS.map((f) => {
            const before = base[f.key] || NOT_DETERMINED
            const after = current[f.key] || NOT_DETERMINED
            const changed = before !== after
            return (
              <tr key={f.key} className="align-top">
                <th scope="row" className="py-2.5 pr-3 font-medium">{f.label}</th>
                <td className={cn('whitespace-pre-line py-2.5 pr-3', changed && 'text-muted')}>
                  {changed ? <del className="decoration-control">{before}</del> : before}
                </td>
                <td className="whitespace-pre-line py-2.5">
                  {changed ? (
                    <ins className="inline-flex gap-1 rounded-[8px] border-l-4 border-primary bg-soft px-2 py-1 font-medium no-underline">
                      <Pencil size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden />{after}
                    </ins>
                  ) : <span className="text-muted">Sin cambios</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
