import type { ReactNode } from 'react'
import { RotateCw } from 'lucide-react'
import { Button, ErrorState, Skeleton } from '@/components/ui'

interface AsyncContentProps {
  isLoading: boolean
  error: string | null
  onRetry?: () => void
  /** Etiqueta accesible del bloque que se está cargando. */
  label: string
  children: ReactNode
}

/** Estados de carga y error homogéneos para las secciones que dependen de la red. */
export default function AsyncContent({ isLoading, error, onRetry, label, children }: AsyncContentProps) {
  if (error) {
    return (
      <ErrorState
        title={`No se pudo cargar: ${label}`}
        text={error}
        action={onRetry && <Button size="sm" variant="secondary" icon={<RotateCw size={15} aria-hidden />} onClick={onRetry}>Reintentar</Button>}
      />
    )
  }
  if (isLoading) {
    return (
      <section aria-busy="true" aria-label={`Cargando ${label}`} className="space-y-3">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </section>
    )
  }
  return <>{children}</>
}
