import { z } from 'zod'

/** Espejo de SOD_RISK_PERMISSIONS / ADMINISTRATIVE_PERMISSIONS (back/apps/accounts/permissions.py). */
export const SOD_RISK_PERMISSIONS = ['riesgo.revisar_agrupacion', 'riesgo.evaluar', 'riesgo.validar'] as const
export const ADMINISTRATIVE_PERMISSIONS = [
  'usuario.administrar',
  'rol.administrar',
  'matriz.administrar',
  'documento.administrar',
  'activo.administrar',
] as const
/** Permisos que el rol ADMIN debe conservar para no perder el gobierno de la plataforma. */
export const ADMIN_REQUIRED_PERMISSIONS = ['usuario.administrar', 'rol.administrar'] as const

const includesAny = (list: readonly string[], values: string[]) => values.some((v) => list.includes(v))

/** Contrato de ROL + ROL_PERMISO (espejo de RolInputSerializer y RoleService.validate_permission_set). */
export const roleFormSchema = z
  .object({
    codigo: z
      .string()
      .trim()
      .min(2, 'Ingrese un código (ej. AUDITOR_TI)')
      .max(50)
      .regex(/^[A-Z][A-Z0-9_]*$/, 'Use MAYÚSCULAS, dígitos y guion bajo (ej. AUDITOR_TI)'),
    nombre: z.string().trim().min(3, 'Ingrese un nombre de al menos 3 caracteres').max(100),
    activo: z.boolean(),
    permisos: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message })
    if (data.codigo === 'ADMIN') {
      if (includesAny(SOD_RISK_PERMISSIONS, data.permisos)) {
        issue('permisos', 'Segregación de Funciones: el rol ADMIN no puede recibir permisos de evaluación o validación de riesgos')
      }
      if (!ADMIN_REQUIRED_PERMISSIONS.every((p) => data.permisos.includes(p))) {
        issue('permisos', 'El rol ADMIN debe conservar la administración de usuarios y de roles')
      }
      if (!data.activo) issue('activo', 'El rol ADMIN no puede desactivarse')
    }
    if (includesAny(SOD_RISK_PERMISSIONS, data.permisos) && includesAny(ADMINISTRATIVE_PERMISSIONS, data.permisos)) {
      issue('permisos', 'Segregación de Funciones: un mismo rol no puede combinar permisos de administración con permisos de evaluación o decisión de riesgos')
    }
  })

export type RoleFormValues = z.infer<typeof roleFormSchema>
