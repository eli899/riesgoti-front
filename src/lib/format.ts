const LOCALE = 'es-PE'

/** Código legible de entidad: INC-0001, RSG-0012. */
export const formatRef = (prefix: 'INC' | 'RSG', n: number) => `${prefix}-${String(n).padStart(4, '0')}`

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(LOCALE, { day: '2-digit', month: 'short', year: 'numeric' })

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(LOCALE, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export const formatAge = (iso: string) => {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 36e5)
  return h < 1 ? 'Menos de 1 h' : h < 24 ? `${h} h` : `${Math.floor(h / 24)} d`
}

export const formatSize = (bytes: number) =>
  bytes > 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} KB`

export const NOT_DETERMINED = 'No determinado con la información disponible'
