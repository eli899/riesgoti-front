import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AIConnectionCheck } from '@/types/domain.types'

interface AIConnectionPingCardProps {
  title: string
  check: AIConnectionCheck
  dimensions?: number | null
}

/** Resultado de la prueba de conectividad de un proveedor (LLM o embeddings). */
export default function AIConnectionPingCard({ title, check, dimensions }: AIConnectionPingCardProps) {
  return (
    <article className={cn('rounded-[14px] border p-4', check.ok ? 'border-line bg-white' : 'border-2 border-deep bg-soft')}>
      <header className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[14px] font-semibold">{title}</h3>
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold', check.ok ? 'bg-line text-primary-pressed' : 'bg-deep text-white')}>
          {check.ok ? <CheckCircle2 size={14} aria-hidden /> : <XCircle size={14} aria-hidden />}
          {check.ok ? 'Conectado' : 'Error'}
        </span>
      </header>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[13px]">
        <dt className="text-muted">Proveedor</dt>
        <dd className="font-medium">{check.provider}</dd>
        <dt className="text-muted">Modelo</dt>
        <dd className="break-all font-mono text-[12px] text-primary-pressed">{check.model}</dd>
        <dt className="text-muted">Latencia</dt>
        <dd className="font-medium">{check.latencyMs === null ? '—' : `${check.latencyMs} ms`}</dd>
        {dimensions !== undefined && (
          <>
            <dt className="text-muted">Dimensiones</dt>
            <dd className="font-medium">{dimensions === null ? '—' : `${dimensions} dims`}</dd>
          </>
        )}
      </dl>
      {check.error && <p role="alert" className="mt-3 text-[12px] font-medium text-deep">{check.error}</p>}
    </article>
  )
}
