import { z } from 'zod'
import { FIELD_LIMITS, VALIDATION_MESSAGES } from '@/constants/validation.constants'

const M = VALIDATION_MESSAGES.AUTH

export const loginFormSchema = z.object({
  correo: z.string().trim().min(1, M.EMAIL_REQUIRED).email(M.EMAIL_INVALID).max(FIELD_LIMITS.EMAIL_MAX),
  password: z.string().min(1, M.PASSWORD_REQUIRED).max(FIELD_LIMITS.PASSWORD_MAX),
})

export type LoginFormValues = z.infer<typeof loginFormSchema>
