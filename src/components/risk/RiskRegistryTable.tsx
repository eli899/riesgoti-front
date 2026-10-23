import { Repeat } from 'lucide-react'
import { RiskLevelBadge, ValidationBadge } from '@/components/ui'
import { formatDate } from '@/lib/format'
import type { RiskRegistryRow } from '@/types/domain.types'

const NewProposalBadge = ({ number }: { number: number }) => (
  <span className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-dashed border-primary bg-soft px-2 py-0.5 text-[11px] font-semibold text-primary-pressed">
    <Repeat size={11} aria-hidden />Nueva propuesta pendiente (v{number})
  </span>
)

/** Registro de riesgos: una fila por RIESGO con su versión validada vigente (o la última si no hay validada). */
export default function RiskRegistryTable({ rows, onOpen }: { rows: RiskRegistryRow[]; onOpen: (riskId: number) => void }) {
  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-left text-[13.5px]">
          <caption className="sr-only">Registro de riesgos</caption>
          <thead className="border-b border-line text-[12px] text-muted">
            <tr>{['Referencia', 'Riesgo', 'Activo', 'Nivel', 'Estado', 'Incidencias', 'Actualizado'].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium first:pl-5">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.riskId} className="hover:bg-soft">
                <td className="px-4 py-3 pl-5">
                  <button type="button" onClick={() => onOpen(r.riskId)} aria-label={`Abrir ${r.riskCode}: ${r.title}`} className="font-mono text-[12.5px] text-primary-pressed hover:underline">{r.riskCode}</button>
                </td>
                <td className="px-4 py-3">
                  <span className="block font-medium">{r.title}</span>
                  <span className="text-[11.5px] text-muted">Versión {r.versionNumber}</span>
                  {r.category === 'VALIDADO' && r.pendingProposal && <span className="block"><NewProposalBadge number={r.pendingProposal.number} /></span>}
                </td>
                <td className="px-4 py-3 text-muted">{r.assetName ?? 'Activo sin confirmar'}</td>
                <td className="px-4 py-3"><RiskLevelBadge level={r.levelCode} /></td>
                <td className="px-4 py-3"><ValidationBadge status={r.status} /></td>
                <td className="px-4 py-3">{r.incidentCount}</td>
                <td className="px-4 py-3 text-muted"><time dateTime={r.updatedAt}>{formatDate(r.updatedAt)}</time></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-line lg:hidden">
        {rows.map((r) => (
          <li key={r.riskId}>
            <button type="button" onClick={() => onOpen(r.riskId)} className="w-full p-4 text-left hover:bg-soft">
              <span className="flex items-center justify-between gap-2"><span className="font-mono text-[12.5px] text-primary-pressed">{r.riskCode} · v{r.versionNumber}</span><ValidationBadge status={r.status} /></span>
              <span className="mt-1 block font-semibold">{r.title}</span>
              <span className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-muted">{r.assetName ?? 'Activo sin confirmar'} · {r.incidentCount} inc. <RiskLevelBadge level={r.levelCode} /></span>
              {r.category === 'VALIDADO' && r.pendingProposal && <NewProposalBadge number={r.pendingProposal.number} />}
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
