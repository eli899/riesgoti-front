import { AUDIT_ACTION_LABEL, AUDIT_TARGET_LABEL } from '@/lib/labels'
import { formatDateTime } from '@/lib/format'
import type { AuditEvent } from '@/types/domain.types'

const actionLabel = (action: string) => AUDIT_ACTION_LABEL[action] ?? action

/** Bitácora de auditoría (EVENTO_AUDITORIA): fecha, actor, acción, entidades afectadas y detalle. Solo lectura. */
export default function AuditLogTable({ events }: { events: AuditEvent[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-left text-[13px]">
          <caption className="sr-only">Eventos de auditoría</caption>
          <thead className="border-b border-line text-[12px] text-muted">
            <tr>{['Fecha', 'Actor', 'Acción', 'Entidades', 'Detalle'].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium first:pl-5">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-line align-top">
            {events.map((e) => (
              <tr key={e.id}>
                <td className="whitespace-nowrap px-4 py-3 pl-5 text-muted"><time dateTime={e.occurredAt}>{formatDateTime(e.occurredAt)}</time></td>
                <td className="px-4 py-3">{e.actor ? <><span className="block font-medium">{e.actor.name}</span><span className="text-[11.5px] text-muted">{e.actor.email}</span></> : <span className="text-muted">Sistema</span>}</td>
                <td className="px-4 py-3"><span className="block font-medium">{actionLabel(e.action)}</span><code className="font-mono text-[11px] text-muted">{e.action}</code></td>
                <td className="px-4 py-3 text-[12px] text-muted">{e.targets.map((t) => `${AUDIT_TARGET_LABEL[t.kind]} #${t.id}`).join(', ') || '—'}</td>
                <td className="max-w-md break-words px-4 py-3 font-mono text-[11.5px] text-muted">{e.detail ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-line lg:hidden">
        {events.map((e) => (
          <li key={e.id}>
            <article className="p-4" aria-label={`${actionLabel(e.action)} · ${formatDateTime(e.occurredAt)}`}>
              <header className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-[13.5px] font-semibold">{actionLabel(e.action)}</h3>
                <time dateTime={e.occurredAt} className="text-[11.5px] text-muted">{formatDateTime(e.occurredAt)}</time>
              </header>
              <p className="text-[12px] text-muted">{e.actor ? `${e.actor.name} · ${e.actor.email ?? ''}` : 'Sistema'}</p>
              {e.targets.length > 0 && <p className="text-[12px] text-muted">{e.targets.map((t) => `${AUDIT_TARGET_LABEL[t.kind]} #${t.id}`).join(', ')}</p>}
              {e.detail && <p className="mt-1 break-words font-mono text-[11.5px] text-muted">{e.detail}</p>}
            </article>
          </li>
        ))}
      </ul>
    </>
  )
}
