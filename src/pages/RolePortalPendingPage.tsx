import { Construction, LogOut } from 'lucide-react'
import PageMeta from '@/components/seo/PageMeta'
import { Button, Card, Logo } from '@/components/ui'
import { useAuthSession } from '@/hooks/useAuthSession'
import { ROLE_LABEL } from '@/lib/labels'

/** Vista de respaldo para roles personalizados sin portal propio asignado. */
export default function RolePortalPendingPage() {
  const { currentUser, roleCode, logout } = useAuthSession()
  const roleName = roleCode ? ROLE_LABEL[roleCode] : currentUser?.roleName ?? 'tu rol'

  return (
    <>
      <PageMeta title={`Portal ${roleName}`} description="El portal de tu rol en RiesgoTI estará disponible próximamente." />
      <header className="flex h-16 items-center justify-between border-b border-line bg-white px-4 md:px-6">
        <Logo />
        <Button size="sm" variant="ghost" icon={<LogOut size={16} aria-hidden />} onClick={logout}>Salir</Button>
      </header>
      <main id="main-content" className="page-in mx-auto max-w-xl px-4 py-12">
        <Card as="article" aria-labelledby="pending-title" className="p-6 text-center md:p-8">
          <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-soft text-primary" aria-hidden><Construction size={22} /></span>
          <h1 id="pending-title" className="text-[22px] font-bold tracking-tight">Hola, {currentUser?.firstName}</h1>
          <p className="mt-2 text-[14px] text-muted">
            El portal del rol <strong>{roleName}</strong> se está migrando a la nueva plataforma y estará disponible en una próxima versión.
            Tu sesión y tus permisos ya están activos.
          </p>
        </Card>
      </main>
    </>
  )
}
