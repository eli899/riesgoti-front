import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Tokens propios del tema (index.css): sin registrarlos, tailwind-merge tomaría `text-md` por un color y
// `cn('text-md', 'text-muted')` descartaría una de las dos clases.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['2xs', 'md'],
      radius: ['bar', 'inset', 'control', 'tile', 'card', 'card-mobile', 'sheet'],
      // Sin registrar, `shadow-card` se toma por un color de sombra y `cn('shadow-card', 'shadow-none')` conserva ambas.
      shadow: ['card'],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
