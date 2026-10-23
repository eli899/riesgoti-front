import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Clases base de controles de formulario (input, select, textarea). */
export const inputClassName = (hasError?: boolean) =>
  cn(
    'w-full rounded-[10px] bg-white px-3 text-[16px] md:text-[14px] outline-none transition-colors focus:border-primary focus:shadow-[0_0_0_4px_#BFDBFE]',
    hasError ? 'border-2 border-deep bg-soft' : 'border border-control',
  )
