import { Plus } from 'lucide-react'
import { Button } from '@/components/ui'

interface ReporterStats {
  total: number
  inAnalysis: number
  awaitingHuman: number
  closed: number
}

/** Llamado a la acción para reportar una incidencia. */
export function ReportCallToAction({ canReport, onReport }: { canReport: boolean; onReport: () => void }) {
  return (
    <section aria-labelledby="report-cta-title" className="mb-4 flex flex-col gap-5 rounded-[22px] bg-primary-pressed px-6 py-7 text-white md:flex-row md:items-center md:justify-between md:px-8 md:py-9">
      <hgroup>
        <h2 id="report-cta-title" className="text-[23px] font-bold">¿Ocurrió un problema de TI?</h2>
        <p className="mt-1 max-w-xl text-[14px] text-mid">Cuéntanos qué pasó y qué activo se vio afectado. Recibirás una orientación en segundos y tu reporte ayuda a identificar riesgos.</p>
      </hgroup>
      {canReport && <Button variant="inverse" icon={<Plus size={18} aria-hidden />} onClick={onReport} className="shrink-0">Reportar incidencia</Button>}
    </section>
  )
}

/** Indicadores de las incidencias propias. */
export function ReporterStatsSection({ stats }: { stats: ReporterStats }) {
  const items = [
    { label: 'Reportes registrados', value: stats.total },
    { label: 'En análisis', value: stats.inAnalysis },
    { label: 'Pendientes de atención', value: stats.awaitingHuman },
    { label: 'Cerrados', value: stats.closed },
  ]
  return (
    <section aria-label="Resumen de mis reportes" className="mb-9">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((x) => (
          <div key={x.label} className="flex flex-col-reverse rounded-[18px] bg-white px-4 py-5 shadow-card md:rounded-[14px]">
            <dt className="mt-2 text-[13px] text-muted">{x.label}</dt>
            <dd className="text-[29px] font-bold leading-none">{x.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
