import { useCallback } from 'react'
import { ShieldCheck } from 'lucide-react'
import LoginForm from '@/components/auth/LoginForm'
import PageMeta from '@/components/seo/PageMeta'
import { Logo } from '@/components/ui'
import { useAuthSession } from '@/hooks/useAuthSession'
import { toApiFailure } from '@/lib/apiErrors'
import type { LoginFormValues } from '@/schemas/auth.schema'

/** Vista pública de inicio de sesión (JWT). */
export default function LoginPage() {
  const { login, isLoggingIn } = useAuthSession()

  const submit = useCallback(
    async (values: LoginFormValues) => {
      try {
        await login(values)
        return undefined
      } catch (error) {
        return toApiFailure(error, 'No se pudo iniciar sesión.')
      }
    },
    [login],
  )

  return (
    <>
      <PageMeta title="Iniciar sesión" description="Accede a RiesgoTI para reportar incidencias, atenderlas y gobernar los riesgos de seguridad de la información (ISO/IEC 27005)." />
      <main id="main-content" className="grid min-h-screen place-items-center px-4 py-10">
        <section aria-labelledby="login-title" className="page-in w-full max-w-md rounded-sheet border border-line bg-white p-6 shadow-card md:p-8">
          <header className="mb-6">
            <Logo />
            <h1 id="login-title" className="mt-6 text-2xl font-bold tracking-tight">Iniciar sesión</h1>
            <p className="mt-1 text-base text-muted">Usa tu correo institucional. Tu rol define las secciones disponibles.</p>
          </header>
          <LoginForm isSubmitting={isLoggingIn} onSubmit={submit} />
          <footer className="mt-6 flex items-start gap-2 border-t border-line pt-4 text-xs text-muted">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden />
            <p>Sesión protegida con JWT. Los accesos y cambios críticos quedan registrados en la auditoría (ISO/IEC 27001).</p>
          </footer>
        </section>
      </main>
    </>
  )
}
