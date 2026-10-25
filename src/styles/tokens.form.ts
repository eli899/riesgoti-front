import { cn } from '@/lib/utils'

/** Clases base de controles de formulario (input, select, textarea). El foco usa el anillo global de index.css. */
export const inputClassName = (hasError?: boolean) =>
  cn(
    'w-full rounded-control bg-white px-3 text-lg md:text-base transition-colors focus:border-primary',
    hasError ? 'border-2 border-deep bg-soft' : 'border border-control',
  )

/** Partes de un campo de formulario (`Field`) y pie de acciones de formularios y modales. */
export const fieldClassName = {
  label: 'mb-1.5 block text-sm font-semibold',
  optional: 'ml-1 font-normal text-muted',
  help: 'mt-1 block text-xs text-muted',
  error: 'mt-1 flex items-start gap-1 text-xs font-medium text-deep',
  footer: 'flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end',
} as const
