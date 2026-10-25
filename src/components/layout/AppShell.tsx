import { useState, type ReactNode } from 'react'
import { LogOut, Menu, ShieldCheck } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Avatar, Button, IconButton, Logo, Sheet } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface ShellNavItem {
  /** Ruta de la sección (`ROUTE_PATHS.*`); sus rutas de detalle la mantienen resaltada. */
  to: string
  label: string
  icon: ReactNode
  group?: string
}

interface AppShellProps {
  navLabel: string
  items: ShellNavItem[]
  user: { fullName: string; roleName: string }
  onLogout: () => void
  /** Contenido de la sección: cada página aporta su propio <main id="main-content"> con su único <h1>. */
  children: ReactNode
}

/** Estructura autenticada: cabecera institucional, navegación lateral por secciones y área de contenido. */
export default function AppShell({ navLabel, items, user, onLogout, children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const go = () => setMenuOpen(false)

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[70] focus:rounded-inset focus:bg-ink focus:px-3 focus:py-2 focus:text-white">
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-white/95 px-4 backdrop-blur md:px-6">
        <span className="flex items-center gap-2">
          <IconButton label="Abrir menú de navegación" className="md:hidden" onClick={() => setMenuOpen(true)}><Menu size={22} aria-hidden /></IconButton>
          <Logo />
        </span>
        <span className="flex items-center gap-3">
          <span className="hidden text-right leading-tight sm:block">
            <span className="block text-sm font-semibold">{user.fullName}</span>
            <span className="block text-2xs text-muted">{user.roleName}</span>
          </span>
          <Avatar name={user.fullName} />
          <Button size="sm" variant="ghost" icon={<LogOut size={16} aria-hidden />} onClick={onLogout}>Salir</Button>
        </span>
      </header>

      <div className="mx-auto flex max-w-[1440px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-line bg-white p-4 md:block">
          <NavList label={navLabel} items={items} onGo={go} />
        </aside>
        <div className="flex min-h-[calc(100vh-4rem)] min-w-0 flex-1 flex-col px-4 pt-6 md:px-8 md:pt-8">
          <div className="flex-1">{children}</div>
          <footer className="mt-10 flex flex-col gap-1 border-t border-line py-4 text-2xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-primary" aria-hidden />RiesgoTI · Gestión de incidencias y riesgos alineada con ISO/IEC 27001, 27002 y 27005.</p>
            <p>Las acciones críticas quedan registradas en la auditoría.</p>
          </footer>
        </div>
      </div>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Navegación">
        <NavList label={navLabel} items={items} onGo={go} />
      </Sheet>
    </>
  )
}

function NavList({ label, items, onGo }: { label: string; items: ShellNavItem[]; onGo: () => void }) {
  const groups = [...new Set(items.map((i) => i.group ?? ''))]
  return (
    <nav aria-label={label} className="space-y-5">
      {groups.map((g) => (
        <section key={g || 'default'} aria-label={g || undefined}>
          {g && <p aria-hidden className="mb-1.5 px-3 text-2xs font-bold uppercase tracking-[0.08em] text-control">{g}</p>}
          <ul className="space-y-1">
            {items.filter((i) => (i.group ?? '') === g).map((i) => (
              <li key={i.to}>
                {/* NavLink marca aria-current="page" en la sección y en sus rutas de detalle (/risks y /risks/7). */}
                <NavLink to={i.to} onClick={onGo}
                  className={({ isActive }) => cn('relative flex min-h-11 items-center gap-3 rounded-tile border px-3 text-sm font-medium transition-colors',
                    isActive ? 'border-line bg-soft font-semibold text-primary-pressed shadow-card' : 'border-transparent text-muted hover:border-line hover:bg-soft hover:text-ink')}>
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute -left-px h-6 w-1 rounded-r-full bg-primary" aria-hidden />}
                      <span className={cn('shrink-0', isActive ? 'text-primary' : 'text-control')} aria-hidden>{i.icon}</span>
                      {i.label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  )
}
