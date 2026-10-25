/**
 * Tabla de datos canónica (escritorio). La primera columna lleva más margen para alinearse con la cabecera de la
 * tarjeta contenedora. En móvil, las tablas se sustituyen por listas propias de cada componente.
 */
export const tableClassName = {
  scroll: 'overflow-x-auto',
  table: 'w-full text-left text-sm',
  caption: 'sr-only',
  thead: 'border-b border-line text-xs text-muted',
  th: 'px-4 py-3 font-medium first:pl-5',
  tbody: 'divide-y divide-line',
  tr: 'hover:bg-soft',
  td: 'px-4 py-3 first:pl-5',
  tdMuted: 'px-4 py-3 text-muted first:pl-5',
  /**
   * Tablas densas de muchas columnas (cola N2, catálogo de activos): 12px entre columnas y 20px en los bordes, para
   * que nombres y títulos no partan línea. Se apilan como tarjetas en móvil, así que el relleno de celda solo rige
   * desde su punto de corte (`cellMd` / `cellXl`).
   */
  dense: {
    th: 'px-3 py-3 font-medium first:pl-5 last:pr-5',
    cellMd: 'md:px-3 md:py-3 md:first:pl-5 md:last:pr-5',
    cellXl: 'xl:px-3 xl:py-3 xl:first:pl-5 xl:last:pr-5',
  },
} as const
