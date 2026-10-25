import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Dialog, Field } from '@/components/ui'
import FormAlert from '@/components/forms/FormAlert'
import { applyServerErrors } from '@/components/forms/applyServerErrors'
import { cn } from '@/lib/utils'
import type { SubmitResult } from '@/lib/apiErrors'
import { roleFormSchema, type RoleFormValues } from '@/schemas/role.schema'
import { fieldClassName, inputClassName } from '@/styles/tokens.form'

const FIELDS = ['codigo', 'nombre', 'activo', 'permisos'] as const

interface RoleFormModalProps {
  open: boolean
  isSaving: boolean
  onClose: () => void
  onSubmit: (values: RoleFormValues) => Promise<SubmitResult>
}

/** Alta de un ROL personalizado (se crea sin permisos; se configuran a continuación). */
export default function RoleFormModal({ open, ...props }: RoleFormModalProps) {
  return (
    <Dialog open={open} onClose={props.onClose} title="Nuevo rol" sub="Se crea sin permisos; podrás activarlos a continuación.">
      {open && <RoleForm {...props} />}
    </Dialog>
  )
}

function RoleForm({ isSaving, onClose, onSubmit }: Omit<RoleFormModalProps, 'open'>) {
  const { register, handleSubmit, setError, formState: { errors } } = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { codigo: '', nombre: '', activo: true, permisos: [] },
  })

  const submit = handleSubmit(async (values) => {
    const failure = await onSubmit(values)
    if (failure) applyServerErrors(failure, setError, FIELDS)
    else onClose()
  })
  const input = (hasError: boolean) => cn(inputClassName(hasError), 'h-11 md:h-10')

  return (
    <form onSubmit={submit} noValidate aria-label="Datos del rol" className="space-y-4">
      <FormAlert message={errors.root?.server?.message} />
      <Field id="role-nombre" label="Nombre del rol" error={errors.nombre?.message}>
        <input id="role-nombre" placeholder="Ej. Auditor de seguridad" {...register('nombre')} aria-invalid={!!errors.nombre} className={input(!!errors.nombre)} />
      </Field>
      <Field id="role-codigo" label="Código" error={errors.codigo?.message} help="MAYÚSCULAS, dígitos y guion bajo. No podrá cambiarse en roles del sistema.">
        <input id="role-codigo" placeholder="AUDITOR_TI" {...register('codigo', { setValueAs: (v: string) => v.toUpperCase() })} aria-invalid={!!errors.codigo} className={cn(input(!!errors.codigo), 'font-mono uppercase')} />
      </Field>
      <footer className={fieldClassName.footer}>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={isSaving}>{isSaving ? 'Creando…' : 'Crear rol'}</Button>
      </footer>
    </form>
  )
}
