import { XCircle } from 'lucide-react'

/** Error global de un formulario (fallo del servidor no asociable a un campo). */
export default function FormAlert({ id, message }: { id?: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="flex items-start gap-2 rounded-control border-2 border-deep bg-soft px-3 py-2 text-sm font-medium text-deep">
      <XCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
      {message}
    </p>
  )
}
