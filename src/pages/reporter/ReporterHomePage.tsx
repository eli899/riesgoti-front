import { ChevronRight } from 'lucide-react'
import AsyncContent from '@/components/AsyncContent'
import IncidentCardArticle from '@/components/reporter/IncidentCardArticle'
import { ReportCallToAction, ReporterStatsSection } from '@/components/reporter/ReporterOverview'
import PageMeta from '@/components/seo/PageMeta'
import { Button, Card, EmptyState } from '@/components/ui'
import { useAuthSession } from '@/hooks/useAuthSession'
import type { useReporterIncidents } from '@/hooks/incidents/useReporterIncidents'

interface ReporterHomePageProps {
  reporter: ReturnType<typeof useReporterIncidents>
  onReport: () => void
  onOpenIncident: (id: number) => void
  onSeeAll: () => void
}

/** Inicio del Reportante: llamado a reportar, indicadores y reportes recientes. */
export default function ReporterHomePage({ reporter, onReport, onOpenIncident, onSeeAll }: ReporterHomePageProps) {
  const { currentUser } = useAuthSession()
  const recent = reporter.incidents.slice(0, 4)

  return (
    <>
      <PageMeta title="Mis incidencias operativas" description="Portal de reporte y seguimiento de incidencias TI con orientación asistida por IA." />
      <main id="main-content" className="page-in">
        <header className="mb-6">
          <p className="text-[14px] text-muted">Hola,</p>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight">{currentUser?.firstName}</h1>
        </header>
        <ReportCallToAction canReport={reporter.canReport} onReport={onReport} />
        <AsyncContent isLoading={reporter.isLoading} error={reporter.loadError} onRetry={reporter.retryLoad} label="tus incidencias">
          <ReporterStatsSection stats={reporter.stats} />
          <section aria-labelledby="incidents-list-heading">
            <header className="mb-4 flex items-center justify-between">
              <h2 id="incidents-list-heading" className="text-[18px] font-bold">Reportes recientes</h2>
              {reporter.incidents.length > 0 && <Button size="sm" variant="ghost" onClick={onSeeAll}>Ver todos <ChevronRight size={17} aria-hidden /></Button>}
            </header>
            {recent.length === 0 ? (
              <Card><EmptyState title="Aún no tienes reportes" text="Cuando registres una incidencia aparecerá aquí con su orientación y estado." /></Card>
            ) : (
              <ul className="grid gap-3 lg:grid-cols-2">
                {recent.map((i) => <li key={i.id} className="min-w-0"><IncidentCardArticle incident={i} onOpen={onOpenIncident} /></li>)}
              </ul>
            )}
          </section>
        </AsyncContent>
      </main>
    </>
  )
}
