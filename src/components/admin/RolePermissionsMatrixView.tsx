import { useState } from 'react'
import { ChevronDown, ChevronRight, KeyRound, Lock } from 'lucide-react'
import { Button, Card, CardHeader, Dialog, Switch } from '@/components/ui'
import FormAlert from '@/components/forms/FormAlert'
import { PERMISSION_GROUPS } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { SubmitResult } from '@/lib/apiErrors'
import { ADMIN_REQUIRED_PERMISSIONS, ADMINISTRATIVE_PERMISSIONS, roleFormSchema, SOD_RISK_PERMISSIONS, type RoleFormValues } from '@/schemas/role.schema'
import type { Permission, Role } from '@/types/domain.types'

interface RolePermissionsMatrixViewProps {
  roles: Role[]
  permissions: Permission[]
  selectedRoleId: number | null
  isSaving: boolean
  onSelectRole: (roleId: number) => void
  onSave: (values: RoleFormValues, roleId: number) => Promise<SubmitResult>
}

const SOD_LOCK = 'Bloqueado por Segregación de Funciones (ISO 27001)'
const isSod = (code: string) => (SOD_RISK_PERMISSIONS as readonly string[]).includes(code)
const isAdministrative = (code: string) => (ADMINISTRATIVE_PERMISSIONS as readonly string[]).includes(code)

/** Motivo por el que un permiso no puede activarse/desactivarse en el borrador (mismas reglas que RoleService). */
function lockReason(role: Role, draft: string[], code: string): string | null {
  const on = draft.includes(code)
  if (role.code === 'ADMIN' && isSod(code)) return SOD_LOCK
  if (role.code === 'ADMIN' && on && (ADMIN_REQUIRED_PERMISSIONS as readonly string[]).includes(code)) return 'Protegido: el rol ADMIN debe conservarlo'
  if (!on && isSod(code) && draft.some(isAdministrative)) return `${SOD_LOCK}: el rol tiene permisos de administración`
  if (!on && isAdministrative(code) && draft.some(isSod)) return `${SOD_LOCK}: el rol tiene permisos de evaluación de riesgos`
  return null
}

/** Asignación de PERMISO a ROL (ROL_PERMISO) agrupada por módulo, con revisión de cambios antes de guardar. */
export default function RolePermissionsMatrixView({ roles, permissions, selectedRoleId, isSaving, onSelectRole, onSave }: RolePermissionsMatrixViewProps) {
  const role = roles.find((r) => r.id === selectedRoleId) ?? roles[0]
  return (
    <section className="grid gap-4 md:grid-cols-[260px_1fr]" aria-label="Roles y permisos">
      <Card as="aside" aria-label="Roles">
        <nav aria-label="Roles disponibles">
          <ul className="p-2">
            {roles.map((r) => (
              <li key={r.id}>
                <button type="button" aria-current={r.id === role?.id ? 'true' : undefined} onClick={() => onSelectRole(r.id)}
                  className={cn('flex min-h-14 w-full items-center gap-3 rounded-[10px] px-3 text-left transition-colors', r.id === role?.id ? 'bg-soft text-primary-pressed' : 'hover:bg-canvas')}>
                  <KeyRound size={18} className="shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{r.name}</span>
                    <span className="block text-[11px] text-muted">{r.system ? 'Rol del sistema' : 'Rol personalizado'} · {r.permissions.length} permisos · {r.userCount} usuarios</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </Card>
      {role && <RoleEditor key={`${role.id}-${role.permissions.join(',')}`} role={role} permissions={permissions} isSaving={isSaving} onSave={onSave} />}
    </section>
  )
}

function RoleEditor({ role, permissions, isSaving, onSave }: { role: Role; permissions: Permission[]; isSaving: boolean; onSave: RolePermissionsMatrixViewProps['onSave'] }) {
  const [draft, setDraft] = useState<string[]>(role.permissions)
  const [expanded, setExpanded] = useState<string[]>(PERMISSION_GROUPS.map((g) => g.module))
  const [reviewing, setReviewing] = useState(false)
  const [error, setError] = useState<string>()

  const descriptionOf = (code: string) => permissions.find((p) => p.code === code)?.description ?? null
  const knownCodes = new Set(PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.code)))
  const otherPermissions = permissions.filter((p) => p.active && !knownCodes.has(p.code))
  const groups = otherPermissions.length
    ? [...PERMISSION_GROUPS, { module: 'Otros', items: otherPermissions.map((p) => ({ code: p.code, label: p.description ?? p.code })) }]
    : PERMISSION_GROUPS
  const labelOf = (code: string) => groups.flatMap((g) => g.items).find((i) => i.code === code)?.label ?? code

  const added = draft.filter((p) => !role.permissions.includes(p))
  const removed = role.permissions.filter((p) => !draft.includes(p))
  const dirty = added.length > 0 || removed.length > 0

  const toggle = (code: string, on: boolean) => {
    setError(undefined)
    setDraft((prev) => (on ? [...prev, code] : prev.filter((p) => p !== code)))
  }

  const confirm = async () => {
    const parsed = roleFormSchema.safeParse({ codigo: role.code, nombre: role.name, activo: role.active, permisos: draft })
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      setReviewing(false)
      return
    }
    const failure = await onSave(parsed.data, role.id)
    setReviewing(false)
    if (failure) setError(failure.fieldErrors.permisos ?? failure.message)
  }

  return (
    <Card as="article" aria-labelledby={`role-${role.id}-title`}>
      <CardHeader titleId={`role-${role.id}-title`} title={role.name} sub={`Código ${role.code}${role.active ? '' : ' · inactivo'}`} />
      <dl className="grid grid-cols-3 border-b border-line bg-canvas px-4 py-3 text-center md:px-5">
        {[
          ['Permisos activos', draft.length],
          ['Módulos', groups.filter((g) => g.items.some((i) => draft.includes(i.code))).length],
          ['Usuarios', role.userCount],
        ].map(([label, value], index) => (
          <div key={label} className={cn('flex flex-col-reverse', index === 1 && 'border-x border-line')}>
            <dt className="text-[11px] text-muted">{label}</dt>
            <dd className="text-[18px] font-bold">{value}</dd>
          </div>
        ))}
      </dl>
      <section className="space-y-2 p-4 md:p-5" aria-label={`Permisos de ${role.name}`}>
        {role.code === 'ADMIN' && (
          <p className="flex items-start gap-2 rounded-[10px] border border-dashed border-primary bg-soft p-3 text-[12px] text-muted">
            <Lock size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden />
            El rol Administrador no puede revisar agrupaciones, evaluar ni validar riesgos (Segregación de Funciones, ISO/IEC 27001 A.5.3).
          </p>
        )}
        {groups.map((g) => {
          const open = expanded.includes(g.module)
          const active = g.items.filter((i) => draft.includes(i.code)).length
          return (
            <fieldset key={g.module} className="overflow-hidden rounded-[10px] border border-line">
              <legend className="w-full">
                <button type="button" aria-expanded={open} onClick={() => setExpanded(open ? expanded.filter((m) => m !== g.module) : [...expanded, g.module])}
                  className="flex min-h-12 w-full items-center gap-2 px-3 text-left hover:bg-canvas">
                  {open ? <ChevronDown size={17} aria-hidden /> : <ChevronRight size={17} aria-hidden />}
                  <span className="flex-1 font-semibold">{g.module}</span>
                  <span className="text-[12px] text-muted">{active} de {g.items.length} activos</span>
                </button>
              </legend>
              {open && (
                <ul className="space-y-1 border-t border-line p-2">
                  {g.items.map((item) => {
                    const on = draft.includes(item.code)
                    const lock = lockReason(role, draft, item.code)
                    return (
                      <li key={item.code} className="flex items-center justify-between gap-3 rounded-[10px] px-2 py-2 hover:bg-canvas">
                        <span className="min-w-0">
                          <span className="block text-[14px] font-medium">{item.label}</span>
                          <span className="font-mono text-[11px] text-muted">{item.code}</span>
                          {descriptionOf(item.code) && descriptionOf(item.code) !== item.label && <span className="block text-[11px] text-muted">{descriptionOf(item.code)}</span>}
                          {lock && <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-primary-pressed"><Lock size={11} aria-hidden />{lock}</span>}
                        </span>
                        <Switch checked={on} disabled={!!lock} label={lock ? `${item.label}: ${lock}` : item.label} onChange={(v) => toggle(item.code, v)} />
                      </li>
                    )
                  })}
                </ul>
              )}
            </fieldset>
          )
        })}
        <FormAlert message={error} />
        <footer className="flex gap-2 border-t border-line pt-4">
          <Button disabled={!dirty || isSaving} onClick={() => setReviewing(true)}>Revisar y guardar</Button>
          <Button variant="ghost" disabled={!dirty} onClick={() => { setDraft(role.permissions); setError(undefined) }}>Descartar</Button>
        </footer>
      </section>

      <Dialog open={reviewing} onClose={() => setReviewing(false)} title="Resumen de cambios" sub={role.name}
        footer={<><Button variant="secondary" onClick={() => setReviewing(false)}>Cancelar</Button><Button disabled={isSaving} onClick={confirm}>{isSaving ? 'Guardando…' : 'Guardar permisos'}</Button></>}>
        <section className="space-y-3 text-[13px]">
          {added.length > 0 && <article><h3 className="font-semibold">Se agregan</h3><ul className="list-inside list-disc">{added.map((p) => <li key={p}>{labelOf(p)}</li>)}</ul></article>}
          {removed.length > 0 && <article><h3 className="font-semibold">Se retiran</h3><ul className="list-inside list-disc">{removed.map((p) => <li key={p}>{labelOf(p)}</li>)}</ul></article>}
          <p className="text-muted">Los cambios aplican en el próximo inicio de sesión de los {role.userCount} usuarios con este rol.</p>
        </section>
      </Dialog>
    </Card>
  )
}
