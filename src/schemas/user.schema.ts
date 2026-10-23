import { z } from 'zod'

const base = {
  nombres: z.string().trim().min(1, 'Ingrese los nombres').max(100),
  apellidos: z.string().trim().min(1, 'Ingrese los apellidos').max(100),
  correo: z.string().trim().email('Ingrese un correo válido').max(150),
  rol_id: z.number({ required_error: 'Seleccione un rol', invalid_type_error: 'Seleccione un rol' }).int().positive('Seleccione un rol'),
  activo: z.boolean(),
}

/** Alta de USUARIO: la contraseña es obligatoria (el backend aplica además validate_password de Django). */
export const userCreateSchema = z.object({
  ...base,
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
})

/** Edición de USUARIO: la contraseña vacía conserva la actual. */
export const userUpdateSchema = z.object({
  ...base,
  password: z.union([z.literal(''), z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128)]),
})

export type UserFormValues = z.infer<typeof userUpdateSchema>
