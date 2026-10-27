import { Repeat } from 'lucide-react'
import { RiskLevelBadge, ValidationBadge } from '@/components/ui'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { monoClassName } from '@/styles/tokens.layout'
import { tableClassName } from '@/styles/tokens.table'
import type { RiskRegistryRow } from '@/types/domain.types'
import { RISK_REGISTRY_CATEGORY } from '@/constants/domain.constants'

const NewProposalBadge = ({ number }: { number: number }) => (
  <span className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-dashed border-primary bg-soft px-2 py-0.5 text-2xs font-semibold text-primary-pressed">
    <Repeat size={11} aria-hidden />Nueva propuesta pendiente (v{number})
  </span>
)

/** Registro de riesgos: una fila por RIESGO con su versión validada vigente (o la última si no hay validada). */
export default function RiskRegistryTable({ rows, onOpen }: { rows: RiskRegistryRow[]; onOpen: (riskId: number) => void }) {
  return (
    <>
      <div className={cn(tableClassName.scroll, 'hidden lg:block')}>
        <table className={tableClassName.table}>
          <caption className={tableClassName.caption}>Registro de riesgos</caption>
          <thead className={tableClassName.thead}>
            <tr>{['Referencia', 'Riesgo', 'Activo', 'Nivel', 'Estado', 'Incidencias', 'Actualizado'].map((h) => <th key={h} scope="col" className={tableClassName.th}>{h}</th>)}</tr>
          </thead>
          <tbody className={tableClassName.tbody}>
            {rows.map((r) => (
              <tr key={r.riskId} className={tableClassName.tr}>
                <td className={tableClassName.td}>
                  <button type="button" onClick={() => onOpen(r.riskId)} aria-label={`Abrir ${r.riskCode}: ${r.title}`} className={cn(monoClassName, 'hover:underline')}>{r.riskCode}</button>
                </td>
                <td className={tableClassName.td}>
                  <span className="block font-medium">{r.title}</span>
                  <span className="text-2xs text-muted">Versión {r.versionNumber}</span>
                  {r.category === RISK_REGISTRY_CATEGORY.VALIDADO && r.pendingProposal && <span className="block"><NewProposalBadge number={r.pendingProposal.number} /></span>}
                </td>
                <td className={tableClassName.tdMuted}>{r.assetName ?? 'Activo sin confirmar'}</td>
                <td className={tableClassName.td}><RiskLevelBadge level={r.levelCode} /></td>
                <td className={tableClassName.td}><ValidationBadge status={r.status} /></td>
                <td className={tableClassName.td}>{r.incidentCount}</td>
                <td className={tableClassName.tdMuted}><time dateTime={r.updatedAt}>{formatDate(r.updatedAt)}</time></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-line lg:hidden">
        {rows.map((r) => (
          <li key={r.riskId}>
            <button type="button" onClick={() => onOpen(r.riskId)} className="w-full p-4 text-left hover:bg-soft">
              <span className="flex items-center justify-between gap-2"><span className={monoClassName}>{r.riskCode} · v{r.versionNumber}</span><ValidationBadge status={r.status} /></span>
              <span className="mt-1 block font-semibold">{r.title}</span>
              <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">{r.assetName ?? 'Activo sin confirmar'} · {r.incidentCount} inc. <RiskLevelBadge level={r.levelCode} /></span>
              {r.category === RISK_REGISTRY_CATEGORY.VALIDADO && r.pendingProposal && <NewProposalBadge number={r.pendingProposal.number} />}
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
