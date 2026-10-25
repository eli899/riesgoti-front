/**
 * Indicador de foco. Por defecto lo pinta la regla global de index.css (`:focus-visible`, en @layer base); estas
 * clases solo hacen falta para trasladarlo, p. ej. a una tarjeta cuyo botón interno cubre toda su superficie.
 */
export const focusRingClassName = {
  /** En el contenedor: muestra el anillo cuando un descendiente tiene foco por teclado. */
  within: 'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
  /** En el elemento enfocado cuyo contenedor ya muestra el anillo. */
  delegated: 'focus-visible:outline-none',
} as const
