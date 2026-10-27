import { useState, type FormEvent } from 'react'
import { Search } from 'lucide-react'
import AsyncContent from '@/components/AsyncContent'
import AuditLogTable from '@/components/admin/AuditLogTable'
import PageMeta from '@/components/seo/PageMeta'
import { Button, Card, EmptyState, PageHeader, Pager, SectionTitle } from '@/components/ui'
import { useAuditLog } from '@/hooks/admin/useAuditLog'
import { AUDIT_ACTION_LABEL } from '@/constants/labels.constants'
import { cn } from '@/lib/utils'
import { inputClassName } from '@/styles/tokens.form'

/** Bitácora de auditoría transversal (EVENTO_AUDITORIA, ISO/IEC 27001): consulta de solo lectura. */
export default function AuditPage() {
  const a = useAuditLog()
  const [search, setSearch] = useState(a.filters.search ?? '')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    a.setSearch(search.trim())
  }

  return (
    <>
      <PageMeta title="Auditoría — Administración RiesgoTI" description="Bitácora inmutable de accesos y cambios críticos del sistema (ISO/IEC 27001)." />
      <main id="main-content" className="page-in">
        <PageHeader title="Auditoría" sub="Registro inmutable de accesos, cambios de configuración y decisiones sobre incidencias y riesgos." />
        <nav aria-label="Filtros de auditoría" className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <form role="search" onSubmit={submit} className="flex flex-1 gap-2">
            <label htmlFor="audit-search" className="sr-only">Buscar en acción o detalle</label>
            <input id="audit-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar en acción o detalle (p. ej. RSG-0001)"
              className={cn(inputClassName(), 'h-10 flex-1')} />
            <Button type="submit" variant="secondary" icon={<Search size={16} aria-hidden />}>Buscar</Button>
          </form>
          <select aria-label="Filtrar por acción" value={a.filters.action ?? ''} onChange={(e) => a.setAction(e.target.value)} className={cn(inputClassName(), 'h-10 md:w-72')}>
            <option value="">Todas las acciones</option>
            {Object.entries(AUDIT_ACTION_LABEL).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </select>
        </nav>
        <AsyncContent isLoading={a.isLoading} error={a.loadError} onRetry={a.retryLoad} label="la bitácora de auditoría">
          <Card aria-labelledby="audit-heading" className={cn(a.isFetching && 'opacity-70')}>
            <header className="border-b border-line px-4 py-3 md:px-5">
              <SectionTitle id="audit-heading">Eventos</SectionTitle>
              <p className="text-xs text-muted" aria-live="polite">{a.total} eventos encontrados</p>
            </header>
            {a.events.length ? <AuditLogTable events={a.events} /> : <EmptyState title="Sin eventos" text="No hay eventos que coincidan con los filtros." />}
            <Pager page={a.filters.page} pages={a.pages} onChange={a.setPage} />
          </Card>
        </AsyncContent>
      </main>
    </>
  )
}
