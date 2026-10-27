import { z } from 'zod'
import { ADMIN_REQUIRED_PERMISSIONS, ADMINISTRATIVE_PERMISSIONS, ROLES, SOD_RISK_PERMISSIONS } from '@/constants/rbac.constants'
import { FIELD_LIMITS as L, VALIDATION_MESSAGES } from '@/constants/validation.constants'

const M = VALIDATION_MESSAGES.ROLE

const includesAny = (list: readonly string[], values: string[]) => values.some((v) => list.includes(v))

/** Contrato de ROL + ROL_PERMISO (espejo de RolInputSerializer y RoleService.validate_permission_set). */
export const roleFormSchema = z
  .object({
    codigo: z
      .string()
      .trim()
      .min(L.ROLE_CODE_MIN, M.CODE_REQUIRED)
      .max(L.ROLE_CODE_MAX)
      .regex(/^[A-Z][A-Z0-9_]*$/, M.CODE_FORMAT),
    nombre: z.string().trim().min(L.ROLE_NAME_MIN, M.NAME_MIN).max(L.ROLE_NAME_MAX),
    activo: z.boolean(),
    permisos: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message })
    if (data.codigo === ROLES.ADMIN) {
      if (includesAny(SOD_RISK_PERMISSIONS, data.permisos)) {
        issue('permisos', M.SOD_ADMIN)
      }
      if (!ADMIN_REQUIRED_PERMISSIONS.every((p) => data.permisos.includes(p))) {
        issue('permisos', M.ADMIN_REQUIRED)
      }
      if (!data.activo) issue('activo', M.ADMIN_INACTIVE)
    }
    if (includesAny(SOD_RISK_PERMISSIONS, data.permisos) && includesAny(ADMINISTRATIVE_PERMISSIONS, data.permisos)) {
      issue('permisos', M.SOD_COMBINATION)
    }
  })

export type RoleFormValues = z.infer<typeof roleFormSchema>
