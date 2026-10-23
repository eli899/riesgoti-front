import { useState, type ReactNode } from 'react'
import { LogOut, Menu, ShieldCheck } from 'lucide-react'
import { Avatar, Button, IconButton, Logo, Sheet } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface ShellNavItem<T extends string = string> {
  id: T
  label: string
  icon: ReactNode
  group?: string
}

interface AppShellProps<T extends string> {
  navLabel: string
  items: ShellNavItem<T>[]
  active: T
  user: { fullName: string; roleName: string }
  onNavigate: (id: T) => void
  onLogout: () => void
  /** Contenido de la sección: cada página aporta su propio <main id="main-content"> con su único <h1>. */
  children: ReactNode
}

/** Estructura autenticada: cabecera institucional, navegación lateral por secciones y área de contenido. */
export default function AppShell<T extends string>({ navLabel, items, active, user, onNavigate, onLogout, children }: AppShellProps<T>) {
  const [menuOpen, setMenuOpen] = useState(false)
  const go = (id: T) => {
    setMenuOpen(false)
    onNavigate(id)
  }

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[70] focus:rounded-[8px] focus:bg-ink focus:px-3 focus:py-2 focus:text-white">
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-white/95 px-4 backdrop-blur md:px-6">
        <span className="flex items-center gap-2">
          <IconButton label="Abrir menú de navegación" className="md:hidden" onClick={() => setMenuOpen(true)}><Menu size={22} aria-hidden /></IconButton>
          <Logo />
        </span>
        <span className="flex items-center gap-3">
          <span className="hidden text-right leading-tight sm:block">
            <span className="block text-[13px] font-semibold">{user.fullName}</span>
            <span className="block text-[11px] text-muted">{user.roleName}</span>
          </span>
          <Avatar name={user.fullName} />
          <Button size="sm" variant="ghost" icon={<LogOut size={16} aria-hidden />} onClick={onLogout}>Salir</Button>
        </span>
      </header>

      <div className="mx-auto flex max-w-[1440px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-line bg-white p-4 md:block">
          <NavList label={navLabel} items={items} active={active} onGo={go} />
        </aside>
        <div className="flex min-h-[calc(100vh-4rem)] min-w-0 flex-1 flex-col px-4 pt-6 md:px-8 md:pt-8">
          <div className="flex-1">{children}</div>
          <footer className="mt-10 flex flex-col gap-1 border-t border-line py-4 text-[11.5px] text-muted sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-primary" aria-hidden />RiesgoTI · Gestión de incidencias y riesgos alineada con ISO/IEC 27001, 27002 y 27005.</p>
            <p>Las acciones críticas quedan registradas en la auditoría.</p>
          </footer>
        </div>
      </div>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Navegación">
        <NavList label={navLabel} items={items} active={active} onGo={go} />
      </Sheet>
    </>
  )
}

function NavList<T extends string>({ label, items, active, onGo }: { label: string; items: ShellNavItem<T>[]; active: T; onGo: (id: T) => void }) {
  const groups = [...new Set(items.map((i) => i.group ?? ''))]
  return (
    <nav aria-label={label} className="space-y-5">
      {groups.map((g) => (
        <section key={g || 'default'} aria-label={g || undefined}>
          {g && <p aria-hidden className="mb-1.5 px-3 text-[10.5px] font-bold uppercase tracking-[0.08em] text-control">{g}</p>}
          <ul className="space-y-1">
            {items.filter((i) => (i.group ?? '') === g).map((i) => (
              <li key={i.id}>
                <a href={`#/${i.id}`} aria-current={active === i.id ? 'page' : undefined}
                  onClick={(e) => { e.preventDefault(); onGo(i.id) }}
                  className={cn('relative flex min-h-11 items-center gap-3 rounded-[12px] border px-3 text-[13.5px] font-medium transition-colors',
                    active === i.id ? 'border-line bg-soft font-semibold text-primary-pressed shadow-card' : 'border-transparent text-muted hover:border-line hover:bg-soft hover:text-ink')}>
                  {active === i.id && <span className="absolute -left-px h-6 w-1 rounded-r-full bg-primary" aria-hidden />}
                  <span className={cn('shrink-0', active === i.id ? 'text-primary' : 'text-control')} aria-hidden>{i.icon}</span>
                  {i.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  )
}
