import { z } from 'zod'

export const loginFormSchema = z.object({
  correo: z.string().trim().min(1, 'Ingrese su correo institucional').email('Correo electrónico inválido').max(150),
  password: z.string().min(1, 'Ingrese su contraseña').max(128),
})

export type LoginFormValues = z.infer<typeof loginFormSchema>
