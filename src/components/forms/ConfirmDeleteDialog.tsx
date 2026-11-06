import type { ReactNode } from 'react'
import { Trash2 } from 'lucide-react'
import { Button, Dialog } from '@/components/ui'
import FormAlert from '@/components/forms/FormAlert'

interface ConfirmDeleteDialogProps {
  open: boolean
  title: string
  /** Qué se elimina y qué se conserva (p. ej. la bitácora de auditoría). */
  children: ReactNode
  isDeleting: boolean
  /** Motivo del rechazo del servidor (409 por dependencias, 403, etc.). */
  error?: string | null
  confirmLabel?: string
  onCancel: () => void
  onConfirm: () => void
}

/** Confirmación explícita de una eliminación física e irreversible. */
export default function ConfirmDeleteDialog({ open, title, children, isDeleting, error, confirmLabel = 'Eliminar definitivamente', onCancel, onConfirm }: ConfirmDeleteDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      sub="Esta acción no se puede deshacer."
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={isDeleting}>Cancelar</Button>
          <Button variant="danger" icon={<Trash2 size={17} aria-hidden />} onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Eliminando…' : confirmLabel}
          </Button>
        </>
      }
    >
      <section className="space-y-3 text-sm" aria-live="polite">
        <FormAlert message={error ?? undefined} />
        {children}
      </section>
    </Dialog>
  )
}
