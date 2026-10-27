import { Check, Lock, UserRound } from 'lucide-react'
import { Avatar, Card, KV, SectionTitle } from '@/components/ui'
import { PERMISSION_GROUPS, ROLE_LABEL } from '@/constants/labels.constants'
import { cn } from '@/lib/utils'
import type { SessionUser } from '@/types/domain.types'
import { ROLES } from '@/constants/rbac.constants'

/** Datos del usuario autenticado y sus permisos efectivos agrupados por módulo (solo lectura). */
export default function AccountProfileArticle({ profile }: { profile: SessionUser }) {
  const granted = new Set<string>(profile.permissions)
  return (
    <section className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]" aria-label="Perfil y permisos">
      <Card as="article" aria-labelledby="profile-heading" className="p-5 lg:self-start">
        <header className="mb-4 flex items-center gap-3">
          <Avatar name={profile.fullName} size={48} />
          <hgroup>
            <h2 id="profile-heading" className="text-lg font-semibold">{profile.fullName}</h2>
            <p className="text-sm text-muted">{profile.roleName || ROLE_LABEL[profile.roleCode]}</p>
          </hgroup>
        </header>
        <dl>
          <KV k="Correo institucional" v={profile.email} />
          <KV k="Rol" v={`${ROLE_LABEL[profile.roleCode]} (${profile.roleCode})`} />
          <KV k="Permisos efectivos" v={`${profile.permissions.length}`} />
        </dl>
        {profile.roleCode === ROLES.ADMIN && (
          <p className="mt-2 flex items-start gap-2 rounded-control bg-canvas p-3 text-xs text-muted">
            <Lock size={14} className="mt-0.5 shrink-0" aria-hidden />
            Por segregación de funciones (ISO/IEC 27001), el Administrador no revisa, evalúa ni valida riesgos.
          </p>
        )}
        <p className="mt-3 flex items-start gap-2 text-xs text-muted">
          <UserRound size={14} className="mt-0.5 shrink-0" aria-hidden />Los datos y permisos los gestiona un administrador.
        </p>
      </Card>

      <Card aria-labelledby="permissions-heading" className="p-5">
        <SectionTitle id="permissions-heading" className="mb-3">Permisos por módulo</SectionTitle>
        <section className="grid gap-4 sm:grid-cols-2" aria-label="Módulos">
          {PERMISSION_GROUPS.map((g) => (
            <article key={g.module} aria-labelledby={`perm-${g.module}`}>
              <h3 id={`perm-${g.module}`} className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">{g.module}</h3>
              <ul className="space-y-1 text-sm">
                {g.items.map((p) => {
                  const has = granted.has(p.code)
                  return (
                    <li key={p.code} className={cn('flex items-center gap-2', !has && 'text-control')}>
                      {has ? <Check size={14} className="shrink-0 text-primary" aria-hidden /> : <span className="size-3.5 shrink-0" aria-hidden />}
                      {p.label}<span className="sr-only">{has ? ': concedido' : ': no concedido'}</span>
                    </li>
                  )
                })}
              </ul>
            </article>
          ))}
        </section>
      </Card>
    </section>
  )
}
