/** Superficie de tarjeta: radio mayor en móvil y sombra suave. `padded` para tarjetas sin cabecera propia. */
export const cardClassName = {
  base: 'rounded-card-mobile border border-line bg-white shadow-card md:rounded-card',
  padded: 'p-4 md:p-5',
} as const

/** Cabecera de página (`PageHeader`): el único <h1> de la vista, su subtítulo y las acciones principales. */
export const headerClassName = {
  container: 'mb-6',
  row: 'flex flex-col gap-3 md:flex-row md:items-end md:justify-between',
  title: 'text-2xl font-bold tracking-tight md:text-3xl',
  description: 'mt-1 text-base text-muted',
  actions: 'flex flex-wrap gap-2',
} as const

/** Título de sección o de tarjeta (<h2>/<h3>); `withIcon` alinea un icono a la izquierda del texto. */
export const sectionTitleClassName = {
  base: 'text-md font-semibold',
  withIcon: 'flex items-center gap-2',
} as const

/** Identificadores técnicos en monoespaciada (INC-0001, RSG-0001, códigos de documento). */
export const monoClassName = 'font-mono text-xs text-primary-pressed'

/** Enlace de regreso de las vistas de detalle a su sección de origen. */
export const backLinkClassName = 'mb-3 flex min-h-11 items-center gap-1 text-sm font-medium text-primary-hover'
