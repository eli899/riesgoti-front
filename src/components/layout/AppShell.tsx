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
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 bg-white/95 px-4 backdrop-blur md:px-0">
        {/* Separador sutil de 1 px (CHG-0044, reemplaza el degradado de CHG-0043). Desde md solo bajo el área de contenido. */}
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-line md:left-64" />
        {/* Desde md la zona de marca comparte ancho y fondo con la barra lateral: una sola columna oscura (CHG-0044). */}
        <span className="flex items-center gap-2 md:h-full md:w-64 md:shrink-0 md:bg-deep md:px-4">
          <IconButton label="Abrir menú de navegación" className="md:hidden" onClick={() => setMenuOpen(true)}><Menu size={22} aria-hidden /></IconButton>
          <Logo invertFromMd />
        </span>
        <span className="flex items-center gap-3 md:px-6">
          <span className="hidden text-right leading-tight sm:block">
            <span className="block text-sm font-semibold">{user.fullName}</span>
            <span className="block text-2xs text-muted">{user.roleName}</span>
          </span>
          <Avatar name={user.fullName} />
          <Button size="sm" variant="ghost" icon={<LogOut size={16} aria-hidden />} onClick={onLogout}>Salir</Button>
        </span>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)] w-full">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto bg-deep p-4 md:block">
          <NavList label={navLabel} items={items} onGo={go} tone="dark" />
        </aside>
        <div className="flex min-h-[calc(100vh-4rem)] min-w-0 flex-1 flex-col px-4 pt-6 md:px-8 md:pt-8">
          <div className="mx-auto w-full max-w-[1440px] min-w-0 flex-1">{children}</div>
          <footer className="mx-auto mt-10 flex w-full max-w-[1440px] flex-col gap-1 border-t border-line py-4 text-2xs text-muted sm:flex-row sm:items-center sm:justify-between">
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

/** Estilos de la navegación según el fondo: barra lateral oscura (escritorio) o panel claro (menú móvil). */
const NAV_TONE = {
  dark: {
    group: 'text-mid/60',
    active: 'border-white/10 bg-white/10 font-semibold text-white focus-visible:outline-white',
    idle: 'border-transparent text-mid hover:bg-white/5 hover:text-white focus-visible:outline-white',
    indicator: 'bg-accent',
    iconActive: 'text-accent',
    iconIdle: 'text-mid/70',
  },
  light: {
    group: 'text-control',
    active: 'border-line bg-soft font-semibold text-primary-pressed shadow-card',
    idle: 'border-transparent text-muted hover:border-line hover:bg-soft hover:text-ink',
    indicator: 'bg-primary',
    iconActive: 'text-primary',
    iconIdle: 'text-control',
  },
} as const

function NavList({ label, items, onGo, tone = 'light' }: { label: string; items: ShellNavItem[]; onGo: () => void; tone?: keyof typeof NAV_TONE }) {
  const t = NAV_TONE[tone]
  const groups = [...new Set(items.map((i) => i.group ?? ''))]
  return (
    <nav aria-label={label} className="space-y-5">
      {groups.map((g) => (
        <section key={g || 'default'} aria-label={g || undefined}>
          {g && <p aria-hidden className={cn('mb-1.5 px-3 text-2xs font-bold uppercase tracking-[0.08em]', t.group)}>{g}</p>}
          <ul className="space-y-1">
            {items.filter((i) => (i.group ?? '') === g).map((i) => (
              <li key={i.to}>
                {/* NavLink marca aria-current="page" en la sección y en sus rutas de detalle (/risks y /risks/7). */}
                <NavLink to={i.to} onClick={onGo}
                  className={({ isActive }) => cn('relative flex min-h-11 items-center gap-3 rounded-tile border px-3 text-sm font-medium transition-colors',
                    isActive ? t.active : t.idle)}>
                  {({ isActive }) => (
                    <>
                      {isActive && <span className={cn('absolute -left-px h-6 w-1 rounded-r-full', t.indicator)} aria-hidden />}
                      <span className={cn('shrink-0', isActive ? t.iconActive : t.iconIdle)} aria-hidden>{i.icon}</span>
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
