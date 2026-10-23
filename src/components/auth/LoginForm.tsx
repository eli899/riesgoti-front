import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { Button, Field, IconButton } from '@/components/ui'
import FormAlert from '@/components/forms/FormAlert'
import { applyServerErrors } from '@/components/forms/applyServerErrors'
import { cn, inputClassName } from '@/lib/utils'
import type { SubmitResult } from '@/lib/apiErrors'
import { loginFormSchema, type LoginFormValues } from '@/schemas/auth.schema'

interface LoginFormProps {
  isSubmitting: boolean
  onSubmit: (values: LoginFormValues) => Promise<SubmitResult>
  /** Cuentas semilla de demostración/QA (solo en desarrollo). */
  demoAccounts?: { email: string; label: string }[]
  /** Si existe, elegir una cuenta inicia sesión con JWT real; si no, solo precarga el correo. */
  onDemoLogin?: (email: string) => Promise<SubmitResult>
}

/** Formulario de inicio de sesión con correo institucional y contraseña. */
export default function LoginForm({ isSubmitting, onSubmit, demoAccounts = [], onDemoLogin }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, setError, setValue, setFocus, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { correo: '', password: '' },
  })

  const submit = handleSubmit(async (values) => {
    const failure = await onSubmit(values)
    if (failure) applyServerErrors(failure, setError, ['correo', 'password'])
  })
  const pickDemo = async (email: string) => {
    setValue('correo', email, { shouldValidate: true })
    if (!onDemoLogin) return setFocus('password')
    const failure = await onDemoLogin(email)
    if (failure) setError('root.server', { type: 'server', message: failure.message })
  }
  const input = (hasError: boolean) => cn(inputClassName(hasError), 'h-12 md:h-11')

  return (
    <form onSubmit={submit} noValidate aria-label="Inicio de sesión" className="space-y-4">
      <FormAlert message={errors.root?.server?.message} />
      <Field id="login-correo" label="Correo institucional" error={errors.correo?.message}>
        <input id="login-correo" type="email" autoComplete="username" autoFocus {...register('correo')} aria-invalid={!!errors.correo} className={input(!!errors.correo)} />
      </Field>
      <Field id="login-password" label="Contraseña" error={errors.password?.message}>
        <span className="relative block">
          <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" {...register('password')} aria-invalid={!!errors.password} className={cn(input(!!errors.password), 'pr-12')} />
          <IconButton label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword((v) => !v)} className="absolute right-0.5 top-1/2 size-10 -translate-y-1/2">
            {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
          </IconButton>
        </span>
      </Field>
      <Button type="submit" full icon={<LogIn size={18} aria-hidden />} disabled={isSubmitting}>{isSubmitting ? 'Ingresando…' : 'Ingresar'}</Button>

      {demoAccounts.length > 0 && (
        <fieldset className="rounded-[12px] border border-dashed border-mid p-3">
          <legend className="px-1 text-[12px] font-semibold text-muted">Perfiles semilla (entorno de desarrollo)</legend>
          <p className="mb-2 text-[11.5px] text-muted">{onDemoLogin ? 'Inicia sesión con un JWT real del perfil elegido.' : 'Precarga el correo; ingresa la contraseña semilla.'}</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {demoAccounts.map((a) => (
              <li key={a.email}>
                <Button size="sm" variant="secondary" full disabled={isSubmitting} onClick={() => void pickDemo(a.email)} aria-label={`${onDemoLogin ? 'Ingresar como' : 'Usar'} ${a.label}: ${a.email}`}>
                  <span className="truncate">{a.label}</span>
                </Button>
              </li>
            ))}
          </ul>
        </fieldset>
      )}
    </form>
  )
}
