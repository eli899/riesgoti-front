import { useCallback } from 'react'
import { ShieldCheck } from 'lucide-react'
import LoginBrandPanel from '@/components/auth/LoginBrandPanel'
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
      <main id="main-content" className="grid min-h-screen lg:grid-cols-2">
        <LoginBrandPanel />
        <section aria-labelledby="login-title" className="grid place-items-center bg-canvas px-4 py-10 md:px-8">
          <article className="page-in w-full max-w-md rounded-sheet border border-line bg-white p-6 shadow-card md:p-10 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <header className="mb-8">
              <span className="lg:hidden"><Logo /></span>
              <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-primary lg:mt-0">Acceso a la plataforma</p>
              <h1 id="login-title" className="mt-1 text-3xl font-bold tracking-tight">Iniciar sesión</h1>
              <p className="mt-2 text-base text-muted">Usa tu correo institucional. Tu rol define las secciones disponibles.</p>
            </header>
            <LoginForm isSubmitting={isLoggingIn} onSubmit={submit} />
            <footer className="mt-8 flex items-start gap-3 rounded-tile bg-soft p-3 text-xs text-muted">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden />
              <p>Sesión protegida con JWT. Los accesos y cambios críticos quedan registrados en la auditoría (ISO/IEC 27001).</p>
            </footer>
          </article>
        </section>
      </main>
    </>
  )
}
