import { useCallback } from 'react'
import { ShieldCheck } from 'lucide-react'
import LoginForm from '@/components/auth/LoginForm'
import PageMeta from '@/components/seo/PageMeta'
import { Logo } from '@/components/ui'
import { useAuthSession } from '@/hooks/useAuthSession'
import { toApiFailure } from '@/lib/apiErrors'
import type { LoginFormValues } from '@/schemas/auth.schema'

// Usuarios de seed_riesgoti; solo se ofrecen en desarrollo. La contraseña semilla nunca se versiona en el código:
// se lee de VITE_DEMO_PASSWORD (.env local) y, sin ella, el selector solo precarga el correo.
const DEMO_ACCOUNTS = import.meta.env.DEV
  ? [
      { email: 'lucia.ramirez@empresa.pe', label: 'Lucía Ramírez · Reportante' },
      { email: 'jorge.salas@empresa.pe', label: 'Jorge Salas · Reportante' },
      { email: 'andrea.quispe@empresa.pe', label: 'Andrea Quispe · Analista' },
      { email: 'martin.torres@empresa.pe', label: 'Martín Torres · Analista' },
      { email: 'carla.mendoza@empresa.pe', label: 'Carla Mendoza · Administradora' },
      { email: 'diego.vargas@empresa.pe', label: 'Diego Vargas · Administrador' },
    ]
  : []
const DEMO_PASSWORD = import.meta.env.DEV ? import.meta.env.VITE_DEMO_PASSWORD : undefined

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
  const demoLogin = useCallback((correo: string) => submit({ correo, password: DEMO_PASSWORD ?? '' }), [submit])

  return (
    <>
      <PageMeta title="Iniciar sesión" description="Accede a RiesgoTI para reportar incidencias, atenderlas y gobernar los riesgos de seguridad de la información (ISO/IEC 27005)." />
      <main id="main-content" className="grid min-h-screen place-items-center px-4 py-10">
        <section aria-labelledby="login-title" className="page-in w-full max-w-md rounded-[22px] border border-line bg-white p-6 shadow-card md:p-8">
          <header className="mb-6">
            <Logo />
            <h1 id="login-title" className="mt-6 text-[24px] font-bold tracking-tight">Iniciar sesión</h1>
            <p className="mt-1 text-[14px] text-muted">Usa tu correo institucional. Tu rol define las secciones disponibles.</p>
          </header>
          <LoginForm isSubmitting={isLoggingIn} onSubmit={submit} demoAccounts={DEMO_ACCOUNTS} onDemoLogin={DEMO_PASSWORD ? demoLogin : undefined} />
          <footer className="mt-6 flex items-start gap-2 border-t border-line pt-4 text-[12px] text-muted">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden />
            <p>Sesión protegida con JWT. Los accesos y cambios críticos quedan registrados en la auditoría (ISO/IEC 27001).</p>
          </footer>
        </section>
      </main>
    </>
  )
}
