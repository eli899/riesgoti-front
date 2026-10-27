import { AUDIT_ACTION_LABEL, AUDIT_TARGET_LABEL } from '@/constants/labels.constants'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { tableClassName } from '@/styles/tokens.table'
import type { AuditEvent } from '@/types/domain.types'
import { isAuditAction } from '@/constants/audit.constants'

const actionLabel = (action: string) => (isAuditAction(action) ? AUDIT_ACTION_LABEL[action] : action)

/** Bitácora de auditoría (EVENTO_AUDITORIA): fecha, actor, acción, entidades afectadas y detalle. Solo lectura. */
export default function AuditLogTable({ events }: { events: AuditEvent[] }) {
  return (
    <>
      <div className={cn(tableClassName.scroll, 'hidden lg:block')}>
        <table className={tableClassName.table}>
          <caption className={tableClassName.caption}>Eventos de auditoría</caption>
          <thead className={tableClassName.thead}>
            <tr>{['Fecha', 'Actor', 'Acción', 'Entidades', 'Detalle'].map((h) => <th key={h} scope="col" className={tableClassName.th}>{h}</th>)}</tr>
          </thead>
          <tbody className={cn(tableClassName.tbody, 'align-top')}>
            {events.map((e) => (
              <tr key={e.id}>
                <td className={cn(tableClassName.tdMuted, 'whitespace-nowrap')}><time dateTime={e.occurredAt}>{formatDateTime(e.occurredAt)}</time></td>
                <td className={tableClassName.td}>{e.actor ? <><span className="block font-medium">{e.actor.name}</span><span className="text-2xs text-muted">{e.actor.email}</span></> : <span className="text-muted">Sistema</span>}</td>
                <td className={tableClassName.td}><span className="block font-medium">{actionLabel(e.action)}</span><code className="font-mono text-2xs text-muted">{e.action}</code></td>
                <td className={cn(tableClassName.tdMuted, 'text-xs')}>{e.targets.map((t) => `${AUDIT_TARGET_LABEL[t.kind]} #${t.id}`).join(', ') || '—'}</td>
                <td className={cn(tableClassName.tdMuted, 'max-w-md break-words font-mono text-2xs')}>{e.detail ?? '—'}</td>
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
                <h3 className="text-sm font-semibold">{actionLabel(e.action)}</h3>
                <time dateTime={e.occurredAt} className="text-2xs text-muted">{formatDateTime(e.occurredAt)}</time>
              </header>
              <p className="text-xs text-muted">{e.actor ? `${e.actor.name} · ${e.actor.email ?? ''}` : 'Sistema'}</p>
              {e.targets.length > 0 && <p className="text-xs text-muted">{e.targets.map((t) => `${AUDIT_TARGET_LABEL[t.kind]} #${t.id}`).join(', ')}</p>}
              {e.detail && <p className="mt-1 break-words font-mono text-2xs text-muted">{e.detail}</p>}
            </article>
          </li>
        ))}
      </ul>
    </>
  )
}
