import { AlertTriangle } from 'lucide-react'
import type { AIConfig } from '@/types/domain.types'

interface VectorOutdatedAlertProps {
  embeddingModel: string
  versions: AIConfig['outdatedVersions']
}

/** Aviso de desfase del espacio vectorial: versiones activas indexadas con otro modelo de embedding. */
export default function VectorOutdatedAlert({ embeddingModel, versions }: VectorOutdatedAlertProps) {
  if (versions.length === 0) return null
  return (
    <section role="alert" aria-labelledby="vector-outdated-title" className="flex gap-3 rounded-[14px] border-2 border-deep bg-soft p-4">
      <AlertTriangle size={20} className="mt-0.5 shrink-0 text-deep" aria-hidden />
      <div className="min-w-0">
        <h2 id="vector-outdated-title" className="font-semibold text-deep">Documentos pendientes de reindexación</h2>
        <p className="mt-1 text-[13px] text-muted">
          El modelo vigente es <code className="font-mono text-primary-pressed">{embeddingModel}</code>. Estas versiones se indexaron con otro
          modelo y no participarán en las búsquedas hasta reindexarlas desde <strong>Documentos</strong>.
        </p>
        <ul className="mt-2 space-y-1 text-[13px]">
          {versions.map((v) => (
            <li key={v.id}>
              <strong>{v.code}</strong> {v.version} · <span className="font-mono text-[12px] text-muted">{v.embeddingModel ?? 'sin modelo'}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
