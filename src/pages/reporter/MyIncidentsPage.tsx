import { Plus } from 'lucide-react'
import AsyncContent from '@/components/AsyncContent'
import IncidentsTable from '@/components/reporter/IncidentsTable'
import PageMeta from '@/components/seo/PageMeta'
import { Button, PageHeader } from '@/components/ui'
import type { useReporterIncidents } from '@/hooks/incidents/useReporterIncidents'

interface MyIncidentsPageProps {
  reporter: ReturnType<typeof useReporterIncidents>
  onReport: () => void
  onOpenIncident: (id: number) => void
}

/** Bandeja completa de incidencias propias del Reportante. */
export default function MyIncidentsPage({ reporter, onReport, onOpenIncident }: MyIncidentsPageProps) {
  return (
    <>
      <PageMeta title="Mis incidencias reportadas" description="Historial de las incidencias que registraste, con su estado y orientación." />
      <main id="main-content" className="page-in">
        <PageHeader title="Mis incidencias reportadas" sub="Solo ves los reportes que registraste."
          actions={reporter.canReport && <Button icon={<Plus size={18} aria-hidden />} onClick={onReport}>Reportar incidencia</Button>} />
        <section aria-label="Listado de incidencias">
          <AsyncContent isLoading={reporter.isLoading} error={reporter.loadError} onRetry={reporter.retryLoad} label="tus incidencias">
            <IncidentsTable incidents={reporter.incidents} onOpen={onOpenIncident} />
          </AsyncContent>
        </section>
      </main>
    </>
  )
}
