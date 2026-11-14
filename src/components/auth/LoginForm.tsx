import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { Button, Field, IconButton } from '@/components/ui'
import FormAlert from '@/components/forms/FormAlert'
import { applyServerErrors } from '@/components/forms/applyServerErrors'
import { cn } from '@/lib/utils'
import type { SubmitResult } from '@/lib/apiErrors'
import { loginFormSchema, type LoginFormValues } from '@/schemas/auth.schema'
import { inputClassName } from '@/styles/tokens.form'

interface LoginFormProps {
  isSubmitting: boolean
  onSubmit: (values: LoginFormValues) => Promise<SubmitResult>
}

/** Formulario de inicio de sesión con correo institucional y contraseña. */
export default function LoginForm({ isSubmitting, onSubmit }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, setError, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { correo: '', password: '' },
  })

  const submit = handleSubmit(async (values) => {
    const failure = await onSubmit(values)
    if (failure) applyServerErrors(failure, setError, ['correo', 'password'])
  })
  const input = (hasError: boolean) => cn(inputClassName(hasError), 'h-12 md:h-11')

  return (
    <form onSubmit={submit} noValidate aria-label="Inicio de sesión" className="space-y-4">
      <FormAlert message={errors.root?.server?.message} />
      <Field id="login-correo" required label="Correo institucional" error={errors.correo?.message}>
        <input id="login-correo" type="email" autoComplete="username" autoFocus {...register('correo')} aria-invalid={!!errors.correo} className={input(!!errors.correo)} />
      </Field>
      <Field id="login-password" required label="Contraseña" error={errors.password?.message}>
        <span className="relative block">
          <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" {...register('password')} aria-invalid={!!errors.password} className={cn(input(!!errors.password), 'pr-12')} />
          <IconButton label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword((v) => !v)} className="absolute right-0.5 top-1/2 size-10 -translate-y-1/2">
            {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
          </IconButton>
        </span>
      </Field>
      <Button type="submit" full icon={<LogIn size={18} aria-hidden />} disabled={isSubmitting}>{isSubmitting ? 'Ingresando…' : 'Ingresar'}</Button>
    </form>
  )
}
