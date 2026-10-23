import AsyncContent from '@/components/AsyncContent'
import AccountProfileArticle from '@/components/auth/AccountProfileArticle'
import PageMeta from '@/components/seo/PageMeta'
import { PageHeader } from '@/components/ui'
import { useAccountProfile } from '@/hooks/useAccountProfile'

/** Mi cuenta: perfil del usuario autenticado y permisos efectivos de su rol (común a todos los portales). */
export default function AccountPage() {
  const a = useAccountProfile()
  return (
    <>
      <PageMeta title="Mi cuenta — RiesgoTI" description="Datos de tu cuenta, rol y permisos efectivos en RiesgoTI." />
      <main id="main-content" className="page-in">
        <PageHeader title="Mi cuenta" sub="Tu identidad, rol y permisos vigentes en el sistema." />
        <AsyncContent isLoading={a.isLoading} error={a.loadError} onRetry={a.retryLoad} label="tu cuenta">
          {a.profile && <AccountProfileArticle profile={a.profile} />}
        </AsyncContent>
      </main>
    </>
  )
}
