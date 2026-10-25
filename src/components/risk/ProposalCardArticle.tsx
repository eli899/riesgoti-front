import { BookOpen, ChevronRight, GitMerge, Repeat, Server } from 'lucide-react'
import { AIBadge, SectionTitle, ValidationBadge } from '@/components/ui'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { focusRingClassName } from '@/styles/tokens.focus'
import { monoClassName } from '@/styles/tokens.layout'
import type { RiskVersion } from '@/types/domain.types'

/** Tarjeta de una propuesta de riesgo (VERSION_RIESGO) en la bandeja; toda la tarjeta abre el espacio de trabajo. */
export default function ProposalCardArticle({ version, onOpen }: { version: RiskVersion; onOpen: (versionId: number) => void }) {
  const titleId = `proposal-${version.id}-title`
  return (
    <article aria-labelledby={titleId} className={cn('relative flex min-w-0 flex-col gap-2 rounded-card border border-line bg-white p-4 shadow-card transition-colors focus-within:border-primary hover:border-mid hover:bg-soft md:flex-row md:items-center md:gap-4', focusRingClassName.within)}>
      <header className="min-w-0 flex-1">
        <p className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className={monoClassName}>{version.riskCode}</span>
          <span>v{version.number}</span>
          {version.origin === 'IA' ? <AIBadge /> : <span>Versión del analista</span>}
          {version.possibleRecurrence && (
            <span className="inline-flex items-center gap-1 rounded-full bg-mid px-2 py-0.5 text-2xs font-semibold text-deep"><Repeat size={12} aria-hidden />Posible recurrencia</span>
          )}
        </p>
        <SectionTitle as="h3" id={titleId}>
          {/* El pseudo-elemento extiende el área clicable del botón a toda la tarjeta, que es quien muestra el foco. */}
          <button type="button" onClick={() => onOpen(version.id)} className={cn('text-left after:absolute after:inset-0 after:rounded-card', focusRingClassName.delegated)}>
            {version.title}
          </button>
        </SectionTitle>
      </header>
      <dl className="grid grid-cols-3 gap-3 text-xs md:flex md:items-center md:gap-5">
        <span className="min-w-0"><dt className="sr-only">Activo identificado</dt><dd className="flex items-center gap-1 truncate text-muted"><Server size={14} className="shrink-0" aria-hidden />{version.confirmedAsset?.name ?? version.identifiedAsset ?? 'Sin activo'}</dd></span>
        <span><dt className="sr-only">Incidencias incluidas</dt><dd className="flex items-center gap-1"><GitMerge size={14} className="text-primary" aria-hidden />{version.includedIncidentCount} inc.</dd></span>
        <span><dt className="sr-only">Fuentes estratégicas</dt><dd className="flex items-center gap-1"><BookOpen size={14} className="text-primary" aria-hidden />{version.citations.length} fuentes</dd></span>
      </dl>
      <footer className="flex items-center justify-between gap-3 md:justify-end">
        <time dateTime={version.createdAt} className="text-xs text-muted">{formatDate(version.createdAt)}</time>
        <ValidationBadge status={version.status} />
        <ChevronRight size={18} className="hidden text-muted md:block" aria-hidden />
      </footer>
    </article>
  )
}
