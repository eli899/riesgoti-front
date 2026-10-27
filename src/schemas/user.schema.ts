import { z } from 'zod'
import { FIELD_LIMITS as L, VALIDATION_MESSAGES } from '@/constants/validation.constants'

const M = VALIDATION_MESSAGES.USER

const base = {
  nombres: z.string().trim().min(1, M.FIRST_NAME_REQUIRED).max(L.PERSON_NAME_MAX),
  apellidos: z.string().trim().min(1, M.LAST_NAME_REQUIRED).max(L.PERSON_NAME_MAX),
  correo: z.string().trim().email(M.EMAIL_INVALID).max(L.EMAIL_MAX),
  rol_id: z.number({ required_error: M.ROLE_REQUIRED, invalid_type_error: M.ROLE_REQUIRED }).int().positive(M.ROLE_REQUIRED),
  activo: z.boolean(),
}

/** Alta de USUARIO: la contraseña es obligatoria (el backend aplica además validate_password de Django). */
export const userCreateSchema = z.object({
  ...base,
  password: z.string().min(L.PASSWORD_MIN, M.PASSWORD_MIN).max(L.PASSWORD_MAX),
})

/** Edición de USUARIO: la contraseña vacía conserva la actual. */
export const userUpdateSchema = z.object({
  ...base,
  password: z.union([z.literal(''), z.string().min(L.PASSWORD_MIN, M.PASSWORD_MIN).max(L.PASSWORD_MAX)]),
})

export type UserFormValues = z.infer<typeof userUpdateSchema>
