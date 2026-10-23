import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Dialog, Field } from '@/components/ui'
import FormAlert from '@/components/forms/FormAlert'
import { applyServerErrors } from '@/components/forms/applyServerErrors'
import { cn, inputClassName } from '@/lib/utils'
import type { SubmitResult } from '@/lib/apiErrors'
import { userCreateSchema, userUpdateSchema, type UserFormValues } from '@/schemas/user.schema'
import type { Role } from '@/types/domain.types'

const FIELDS = ['nombres', 'apellidos', 'correo', 'rol_id', 'password', 'activo'] as const

interface UserFormModalProps {
  open: boolean
  isNew: boolean
  defaultValues: UserFormValues
  roles: Role[]
  isSaving: boolean
  onClose: () => void
  onSubmit: (values: UserFormValues) => Promise<SubmitResult>
}

/** Alta y edición de USUARIO (la contraseña vacía en edición conserva la actual). */
export default function UserFormModal({ open, isNew, ...props }: UserFormModalProps) {
  return (
    <Dialog open={open} onClose={props.onClose} title={isNew ? 'Nuevo usuario' : 'Editar usuario'}>
      {open && <UserForm isNew={isNew} {...props} />}
    </Dialog>
  )
}

function UserForm({ isNew, defaultValues, roles, isSaving, onClose, onSubmit }: Omit<UserFormModalProps, 'open'>) {
  const { register, handleSubmit, setError, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(isNew ? userCreateSchema : userUpdateSchema),
    defaultValues,
  })

  const submit = handleSubmit(async (values) => {
    const failure = await onSubmit(values)
    if (failure) applyServerErrors(failure, setError, FIELDS)
    else onClose()
  })
  const input = (hasError: boolean) => cn(inputClassName(hasError), 'h-11 md:h-10')

  return (
    <form onSubmit={submit} noValidate aria-label="Datos del usuario" className="space-y-4">
      <FormAlert message={errors.root?.server?.message} />
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="sr-only">Identidad</legend>
        <Field id="user-nombres" label="Nombres" error={errors.nombres?.message}>
          <input id="user-nombres" autoComplete="off" {...register('nombres')} aria-invalid={!!errors.nombres} className={input(!!errors.nombres)} />
        </Field>
        <Field id="user-apellidos" label="Apellidos" error={errors.apellidos?.message}>
          <input id="user-apellidos" autoComplete="off" {...register('apellidos')} aria-invalid={!!errors.apellidos} className={input(!!errors.apellidos)} />
        </Field>
      </fieldset>
      <Field id="user-correo" label="Correo" error={errors.correo?.message}>
        <input id="user-correo" type="email" autoComplete="off" {...register('correo')} aria-invalid={!!errors.correo} className={input(!!errors.correo)} />
      </Field>
      <Field id="user-rol" label="Rol" error={errors.rol_id?.message}>
        <select id="user-rol" {...register('rol_id', { valueAsNumber: true })} aria-invalid={!!errors.rol_id} className={input(!!errors.rol_id)}>
          <option value={0} disabled>Selecciona un rol</option>
          {roles.filter((r) => r.active).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </Field>
      <Field id="user-password" label={isNew ? 'Contraseña inicial' : 'Nueva contraseña'} optional={!isNew} error={errors.password?.message}
        help={isNew ? 'Mínimo 8 caracteres; no puede parecerse al correo ni ser común.' : 'Déjala vacía para conservar la contraseña actual.'}>
        <input id="user-password" type="password" autoComplete="new-password" {...register('password')} aria-invalid={!!errors.password} className={input(!!errors.password)} />
      </Field>
      <footer className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={isSaving}>{isSaving ? 'Guardando…' : 'Guardar'}</Button>
      </footer>
    </form>
  )
}
