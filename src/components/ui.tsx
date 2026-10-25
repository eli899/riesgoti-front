/**
 * Átomos presentacionales migrados desde figma/src/ui.tsx.
 * Componentes puros: reciben props de dominio (camelCase) y emiten callbacks. Sin estado de red.
 */
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ComponentPropsWithRef, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import {
  AlertTriangle, Archive, ArrowLeft, BookOpen, CheckCircle2, Circle, CircleDot, Clock, Headset, Inbox,
  Loader2, Pencil, ShieldCheck, Sparkles, Wrench, X, XCircle,
} from 'lucide-react'
import { INCIDENT_STATUS_LABEL, RISK_LEVEL_LABEL, RISK_VALIDATION_LABEL } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { fieldClassName, inputClassName } from '@/styles/tokens.form'
import { backLinkClassName, cardClassName, headerClassName, monoClassName, sectionTitleClassName } from '@/styles/tokens.layout'
import type { AssetCriticality, IncidentStatus, RiskLevelCode, RiskValidationStatus } from '@/types/domain.types'

// ---------------------------------------------------------------------------
// Identidad
// ---------------------------------------------------------------------------
export function Logo({ compact }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-control bg-primary text-white"><ShieldCheck size={20} aria-hidden /></span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-md font-bold">RiesgoTI</span>
          <span className="block text-2xs text-muted">Incidencias que ayudan a identificar riesgos</span>
        </span>
      )}
    </span>
  )
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('')
  return <span style={{ width: size, height: size }} className="grid shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-white" aria-hidden>{initials}</span>
}

// ---------------------------------------------------------------------------
// Botones
// ---------------------------------------------------------------------------
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverse'
const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover active:bg-primary-pressed border border-primary',
  secondary: 'bg-soft text-primary-pressed border border-mid hover:bg-line',
  ghost: 'text-primary hover:bg-soft border border-transparent',
  danger: 'bg-white text-deep border-2 border-deep hover:bg-soft',
  // Sobre fondos oscuros (banner del Reportante): el anillo primario no llegaría a 3:1, el blanco sí (≈ 8,7:1).
  inverse: 'bg-white text-primary-pressed border border-white hover:bg-soft focus-visible:outline-white',
}

export function Button({ variant = 'primary', icon, children, className, full, size = 'md', type = 'button', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; icon?: ReactNode; full?: boolean; size?: 'sm' | 'md' }) {
  return (
    <button {...p} type={type} className={cn('inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:border-disabled disabled:bg-disabled disabled:text-control',
      size === 'sm' ? 'min-h-9 px-3 text-sm' : 'min-h-11 px-4 text-base md:min-h-10', buttonVariants[variant], full && 'w-full', className)}>
      {icon}{children}
    </button>
  )
}

export function IconButton({ label, children, className, type = 'button', ...p }: ComponentPropsWithRef<'button'> & { label: string }) {
  return <button {...p} type={type} aria-label={label} title={label} className={cn('grid size-11 place-items-center rounded-control text-muted transition-colors hover:bg-soft hover:text-primary active:bg-line disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-muted', className)}>{children}</button>
}

// ---------------------------------------------------------------------------
// Contenedores
// ---------------------------------------------------------------------------
export function Card({ children, className, as: As = 'section', ...aria }: { children: ReactNode; className?: string; as?: 'section' | 'article' | 'aside'; 'aria-labelledby'?: string; 'aria-label'?: string }) {
  return <As {...aria} className={cn(cardClassName.base, className)}>{children}</As>
}

export function CardHeader({ title, titleId, icon, action, sub }: { title: string; titleId?: string; icon?: ReactNode; action?: ReactNode; sub?: string }) {
  return (
    <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3 md:px-5">
      <span className="flex items-start gap-2">
        {icon && <span className="mt-0.5 text-primary" aria-hidden>{icon}</span>}
        <span>
          <h2 id={titleId} className={sectionTitleClassName.base}>{title}</h2>
          {sub && <p className="text-xs text-muted">{sub}</p>}
        </span>
      </span>
      {action}
    </header>
  )
}

export function PageHeader({ title, sub, actions, back }: { title: string; sub?: ReactNode; actions?: ReactNode; back?: ReactNode }) {
  return (
    <header className={headerClassName.container}>
      {back}
      <section className={headerClassName.row}>
        <hgroup>
          <h1 className={headerClassName.title}>{title}</h1>
          {sub && <p className={headerClassName.description}>{sub}</p>}
        </hgroup>
        {actions && <span className={headerClassName.actions}>{actions}</span>}
      </section>
    </header>
  )
}

/** Regreso de una vista de detalle a su sección de origen (p. ej. «Registro de riesgos»). */
export function BackLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={backLinkClassName}>
      <ArrowLeft size={16} aria-hidden />{children}
    </button>
  )
}

/** Título de sección o de tarjeta; con `icon`, el icono (decorativo, `aria-hidden`) se alinea a la izquierda. */
export function SectionTitle({ as: As = 'h2', id, icon, className, children }: { as?: 'h2' | 'h3' | 'h4'; id?: string; icon?: ReactNode; className?: string; children: ReactNode }) {
  return <As id={id} className={cn(sectionTitleClassName.base, icon !== undefined && sectionTitleClassName.withIcon, className)}>{icon}{children}</As>
}

// ---------------------------------------------------------------------------
// Formularios
// ---------------------------------------------------------------------------
export function Field({ id, label, help, error, children, optional }: { id: string; label: string; help?: string; error?: string; children: ReactNode; optional?: boolean }) {
  return (
    <p className="m-0">
      <label htmlFor={id} className={fieldClassName.label}>{label}{optional && <span className={fieldClassName.optional}>(opcional)</span>}</label>
      {children}
      {help && !error && <span id={`${id}-help`} className={fieldClassName.help}>{help}</span>}
      {error && <span id={`${id}-err`} role="alert" className={fieldClassName.error}><XCircle size={14} className="mt-px shrink-0" aria-hidden />{error}</span>}
    </p>
  )
}

export function Select({ id, value, onChange, children, error, label }: { id?: string; value: string; onChange: (v: string) => void; children: ReactNode; error?: boolean; label?: string }) {
  return <select id={id} aria-label={label} aria-invalid={error || undefined} value={value} onChange={(e) => onChange(e.target.value)} className={cn(inputClassName(error), 'h-11 md:h-10')}>{children}</select>
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} title={label} disabled={disabled} onClick={() => onChange(!checked)}
      className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50', checked ? 'bg-primary' : 'bg-disabled')}>
      <span aria-hidden className={cn('absolute left-0 top-0.5 size-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5.5' : 'translate-x-0.5')} />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Badges semánticos
// ---------------------------------------------------------------------------
function Pill({ className, icon, children }: { className: string; icon: ReactNode; children: ReactNode }) {
  return <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold', className)}>{icon}{children}</span>
}

const incidentStatusStyle: Record<IncidentStatus, [string, ReactNode]> = {
  REGISTRADA: ['bg-white border border-control text-muted', <CircleDot size={14} aria-hidden />],
  EN_ANALISIS: ['bg-soft text-primary border border-line', <Loader2 size={14} className="animate-spin" aria-hidden />],
  PENDIENTE_ATENCION_HUMANA: ['bg-line text-primary-pressed border border-dashed border-primary', <Headset size={14} aria-hidden />],
  EN_ATENCION: ['bg-mid text-deep', <Wrench size={14} aria-hidden />],
  CERRADA: ['bg-disabled text-muted', <Archive size={14} aria-hidden />],
}
export function StatusBadge({ status }: { status: IncidentStatus }) {
  const [className, icon] = incidentStatusStyle[status]
  return <Pill className={className} icon={icon}>{INCIDENT_STATUS_LABEL[status]}</Pill>
}

const validationStyle: Record<RiskValidationStatus, [string, ReactNode]> = {
  PENDIENTE: ['bg-disabled text-muted border border-dashed border-control', <Clock size={14} aria-hidden />],
  VALIDADA: ['bg-line text-primary-pressed', <CheckCircle2 size={14} aria-hidden />],
  CORREGIDA: ['bg-mid text-deep', <Pencil size={14} aria-hidden />],
  RECHAZADA: ['bg-deep text-white', <XCircle size={14} aria-hidden />],
}
export function ValidationBadge({ status }: { status: RiskValidationStatus }) {
  const [className, icon] = validationStyle[status]
  return <Pill className={className} icon={icon}>{RISK_VALIDATION_LABEL[status]}</Pill>
}

const riskLevelStyle: Record<RiskLevelCode, string> = {
  BAJO: 'bg-soft border border-mid text-primary-pressed',
  MEDIO: 'bg-line text-primary-pressed',
  ALTO: 'bg-primary text-white',
  CRITICO: 'bg-deep text-white',
}
const riskLevelBars: Record<RiskLevelCode, number> = { BAJO: 1, MEDIO: 2, ALTO: 3, CRITICO: 4 }

export function RiskLevelBadge({ level }: { level: RiskLevelCode | null }) {
  if (!level) return <span className="text-xs text-muted">Sin evaluar</span>
  const bars = riskLevelBars[level]
  return (
    <Pill className={riskLevelStyle[level]} icon={<span className="flex items-end gap-px" aria-hidden>{[1, 2, 3, 4].map((b) => <span key={b} className={cn('w-0.5 rounded-sm bg-current', b > bars && 'opacity-30')} style={{ height: 3 + b * 2 }} />)}</span>}>
      {RISK_LEVEL_LABEL[level]}
    </Pill>
  )
}

export function CriticalityBadge({ criticality }: { criticality: AssetCriticality }) {
  return <span className="inline-flex items-center gap-1 text-xs"><span className="text-muted">Criticidad</span><RiskLevelBadge level={criticality} /></span>
}

export function AIBadge() {
  return <span className="inline-flex items-center gap-1 rounded-full bg-soft px-2 py-0.5 text-2xs font-semibold text-primary"><Sparkles size={12} aria-hidden />Generado por IA</span>
}

export function Mono({ children }: { children: ReactNode }) {
  return <code className={monoClassName}>{children}</code>
}

export function KV({ k, v, nd }: { k: string; v: ReactNode; nd?: boolean }) {
  return <><dt className="text-xs font-medium text-muted">{k}</dt><dd className={cn('mt-0.5 mb-3 text-base', nd && 'italic text-control')}>{v}</dd></>
}

// ---------------------------------------------------------------------------
// Estados de vista
// ---------------------------------------------------------------------------
export function EmptyState({ title, text, action, icon }: { title: string; text: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-3 grid size-12 place-items-center rounded-full bg-soft text-primary" aria-hidden>{icon ?? <Inbox size={22} />}</span>
      <SectionTitle as="h3">{title}</SectionTitle>
      <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>
      {action && <footer className="mt-4">{action}</footer>}
    </section>
  )
}

export function ErrorState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <section role="alert" className="flex flex-col gap-3 rounded-card border-2 border-deep bg-soft p-4 sm:flex-row sm:items-center">
      <AlertTriangle className="shrink-0 text-deep" size={20} aria-hidden />
      <span className="flex-1"><strong className="block font-semibold text-deep">{title}</strong><span className="block text-sm text-muted">{text}</span></span>
      {action}
    </section>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn('block animate-pulse rounded-bar bg-line', className)} />
}

// ---------------------------------------------------------------------------
// Navegación
// ---------------------------------------------------------------------------
export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (t: T) => void; label: string }) {
  return (
    <nav role="tablist" aria-label={label} className="no-scrollbar -mx-1 mb-4 flex gap-1 overflow-x-auto border-b border-line px-1">
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={cn('-mb-px flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-base font-medium transition-colors', value === t.id ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink')}>
          {t.label}{t.count !== undefined && <span className={cn('rounded-full px-1.5 text-2xs', value === t.id ? 'bg-soft' : 'bg-disabled')}>{t.count}</span>}
        </button>
      ))}
    </nav>
  )
}

export function Chips<T extends string>({ items, value, onChange, label }: { items: { id: T; label: string; disabled?: boolean }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <fieldset aria-label={label} className="no-scrollbar flex min-w-0 gap-2 overflow-x-auto border-0 p-0">
      {items.map((i) => (
        <button key={i.id} type="button" aria-pressed={value === i.id} disabled={i.disabled} onClick={() => onChange(i.id)}
          className={cn('min-h-9 shrink-0 rounded-full border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50', value === i.id ? 'border-primary bg-primary text-white active:bg-primary-pressed' : 'border-line bg-white text-muted hover:border-mid active:bg-soft disabled:hover:border-line')}>{i.label}</button>
      ))}
    </fieldset>
  )
}

export function Pager({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null
  return (
    <nav aria-label="Paginación" className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-muted">
      <span aria-live="polite">Página {page} de {pages}</span>
      <span className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>Anterior</Button>
        <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>Siguiente</Button>
      </span>
    </nav>
  )
}

// ---------------------------------------------------------------------------
// Superposiciones (Dialog / Sheet) con trampa de foco
// ---------------------------------------------------------------------------
function useFocusTrap<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const containerRef = useRef<T>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const el = containerRef.current
    const focusables = () => el ? Array.from(el.querySelectorAll<HTMLElement>('button:not([disabled]),input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])')) : []
    const timer = setTimeout(() => (focusables()[0] ?? el)?.focus(), 10)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
      if (e.key !== 'Tab') return
      const f = focusables()
      if (!f.length) return
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => { clearTimeout(timer); document.removeEventListener('keydown', onKey); previous?.focus() }
  }, [open])

  return containerRef
}

const DIALOG_WIDTH = { md: 'md:max-w-md', lg: 'md:max-w-2xl', xl: 'md:max-w-5xl' } as const

export function Dialog({ open, onClose, title, children, footer, wide, size, sub, bodyClassName }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean; size?: keyof typeof DIALOG_WIDTH; sub?: string; bodyClassName?: string }) {
  const ref = useFocusTrap<HTMLElement>(open, onClose)
  const titleId = useId()
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 md:items-center md:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
        className={cn('up-in flex max-h-[92vh] w-full flex-col rounded-t-sheet bg-white md:rounded-card-mobile', DIALOG_WIDTH[size ?? (wide ? 'lg' : 'md')])}>
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <hgroup><h2 id={titleId} className="text-xl font-bold">{title}</h2>{sub && <p className="text-sm text-muted">{sub}</p>}</hgroup>
          <IconButton label="Cerrar" onClick={onClose} className="-mr-2 -mt-1"><X size={20} aria-hidden /></IconButton>
        </header>
        <article className={cn('flex-1 overflow-y-auto px-5 py-4', bodyClassName)}>{children}</article>
        {footer && <footer className="flex flex-col-reverse gap-2 border-t border-line px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">{footer}</footer>}
      </section>
    </div>
  )
}

export function Sheet({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useFocusTrap<HTMLElement>(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-ink/40" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className={cn('sheet-in absolute inset-y-0 right-0 flex w-full flex-col bg-white', wide ? 'md:max-w-xl' : 'md:max-w-sm')}>
        <header className="flex items-center justify-between border-b border-line px-5 py-3"><h2 className="text-lg font-bold">{title}</h2><IconButton label="Cerrar" onClick={onClose}><X size={20} aria-hidden /></IconButton></header>
        <section className="flex-1 overflow-y-auto p-5">{children}</section>
      </aside>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Fuentes RAG y progreso de análisis IA
// ---------------------------------------------------------------------------
export function SourceCard({ n, title, version, page, fragment, onOpen }: { n: number; title: string; version: string; page: string; fragment: string; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} aria-label={`Abrir fuente ${n}: ${title}, versión ${version}, página ${page}`}
      className="flex w-full gap-3 rounded-tile border border-line bg-white p-3 text-left transition-colors hover:border-mid hover:bg-soft">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary font-mono text-xs text-white" aria-hidden>{n}</span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-sm font-semibold"><BookOpen size={14} className="text-primary" aria-hidden />{title}</span>
        <span className="block text-xs text-muted">Versión {version} · Página {page}</span>
        <q className="mt-1 line-clamp-2 block text-xs text-muted">{fragment}</q>
      </span>
    </button>
  )
}

const ANALYSIS_STEPS = ['Analizando reporte', 'Extrayendo elementos', 'Buscando coincidencias', 'Consultando fuentes', 'Preparando propuesta', 'Resultado listo']

export function AnalysisProgress({ stage, failed }: { stage: number; failed?: boolean }) {
  return (
    <ol aria-live="polite" className="space-y-2">
      {ANALYSIS_STEPS.map((s, i) => {
        const done = i < stage || (i === 5 && stage >= 5)
        const current = i === stage && !failed && stage < 5
        const error = failed && i === stage
        return (
          <li key={s} aria-current={current ? 'step' : undefined} className={cn('flex items-center gap-2 text-sm', done ? 'text-ink' : current ? 'font-semibold text-primary' : error ? 'font-semibold text-deep' : 'text-control')}>
            {error ? <XCircle size={16} aria-hidden /> : done ? <CheckCircle2 size={16} className="text-primary" aria-hidden /> : current ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Circle size={16} aria-hidden />}
            {s}{error && ' · error'}
          </li>
        )
      })}
    </ol>
  )
}

// ---------------------------------------------------------------------------
// Renderizado seguro de Markdown (tablas técnicas de manuales PDF y pasos RAG)
// ---------------------------------------------------------------------------
interface MarkdownViewerProps {
  content: string
  className?: string
  onCitationClick?: (citationNumber: number) => void
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  return (
    <article className={cn('prose prose-slate max-w-none text-sm', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {content}
      </ReactMarkdown>
    </article>
  )
}
