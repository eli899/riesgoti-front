import { CheckCircle2, Circle, ListChecks } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface SetupStep {
  id: string
  label: string
  description: string
  done: boolean
  actionLabel: string
  onOpen: () => void
}

/** Pasos de puesta en marcha tras la semilla base (CHG-0039); se oculta cuando todos están completos. */
export default function InitialSetupChecklist({ steps }: { steps: SetupStep[] }) {
  const pending = steps.filter((s) => !s.done).length
  if (pending === 0) return null
  return (
    <Card as="article" aria-labelledby="setup-title" className="mb-4 overflow-hidden">
      <CardHeader titleId="setup-title" title="Puesta en marcha" icon={<ListChecks size={18} />} sub={`${pending} ${pending === 1 ? 'paso pendiente' : 'pasos pendientes'} para que la plataforma opere completa`} />
      <ol className="divide-y divide-line">
        {steps.map((step, index) => (
          <li key={step.id} className={cn('flex flex-wrap items-center gap-3 px-4 py-3 md:px-5', step.done && 'bg-canvas')}>
            {step.done
              ? <CheckCircle2 size={20} className="shrink-0 text-primary" aria-hidden />
              : <Circle size={20} className="shrink-0 text-control" aria-hidden />}
            <p className="min-w-0 flex-1 text-sm">
              <strong className={cn('block font-semibold', step.done && 'text-muted line-through')}>{index + 1}. {step.label}</strong>
              <span className="block text-xs text-muted">{step.done ? 'Completado.' : step.description}</span>
            </p>
            {!step.done && (
              <button type="button" onClick={step.onOpen} className="text-sm font-semibold text-primary underline-offset-2 hover:underline">{step.actionLabel}</button>
            )}
          </li>
        ))}
      </ol>
    </Card>
  )
}
