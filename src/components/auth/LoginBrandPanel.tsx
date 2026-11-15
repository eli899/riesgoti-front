import type { ReactNode } from 'react'
import { Headset, Lightbulb, ShieldCheck, TrendingUp } from 'lucide-react'

const HIGHLIGHTS: { icon: ReactNode; title: string; text: string }[] = [
  { icon: <Lightbulb size={18} aria-hidden />, title: 'Orientación inmediata', text: 'La IA sugiere pasos de resolución citando la normativa interna autorizada.' },
  { icon: <Headset size={18} aria-hidden />, title: 'Atención con trazabilidad', text: 'Cada incidencia sin respaldo pasa a un analista y su atención queda registrada.' },
  { icon: <TrendingUp size={18} aria-hidden />, title: 'Gobierno de riesgos', text: 'Las incidencias recurrentes se convierten en riesgos evaluados según ISO/IEC 27005.' },
]

/** Panel de marca de la vista de inicio de sesión (solo en pantallas grandes). */
export default function LoginBrandPanel() {
  return (
    <aside aria-label="Acerca de RiesgoTI" className="relative hidden overflow-hidden bg-deep p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
      <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-primary/40 blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-primary-pressed/60 blur-3xl" />

      <header className="relative flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-control bg-white/10 ring-1 ring-white/20"><ShieldCheck size={22} aria-hidden /></span>
        <span className="leading-tight">
          <span className="block text-lg font-bold">RiesgoTI</span>
          <span className="block text-xs text-mid">Incidencias que ayudan a identificar riesgos</span>
        </span>
      </header>

      <section aria-label="Propuesta de valor" className="relative max-w-md">
        <p className="text-3xl font-bold leading-tight tracking-tight">De cada incidencia, una decisión informada sobre el riesgo.</p>
        <ul className="mt-8 space-y-5">
          {HIGHLIGHTS.map((h) => (
            <li key={h.title} className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-tile bg-white/10 text-mid ring-1 ring-white/15">{h.icon}</span>
              <span>
                <span className="block text-md font-semibold">{h.title}</span>
                <span className="block text-sm text-mid">{h.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="relative text-xs text-mid">Alineado con ISO/IEC 27001, 27002 y 27005 (2022).</footer>
    </aside>
  )
}
