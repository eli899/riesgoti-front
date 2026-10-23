import { useCallback, useSyncExternalStore } from 'react'

const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}
const getHash = () => window.location.hash

/**
 * Sección activa de un portal sincronizada con el hash de la URL (`#/docs`, `#/incident/42`), sin dependencias de
 * enrutado: recargar, compartir el enlace o usar atrás/adelante conserva la vista. `param` es el segundo segmento.
 */
export function useHashSection<T extends string>(sections: readonly T[], fallback: T) {
  const hash = useSyncExternalStore(subscribe, getHash, () => '')
  const [candidate, rawParam] = hash.replace(/^#\/?/, '').split('/') as [T, string | undefined]
  const valid = sections.includes(candidate)
  const section = valid ? candidate : fallback
  const param = valid && rawParam ? decodeURIComponent(rawParam) : null

  const navigate = useCallback((next: T, nextParam?: string | number) => {
    const target = nextParam === undefined ? `#/${next}` : `#/${next}/${encodeURIComponent(String(nextParam))}`
    if (window.location.hash !== target) window.location.hash = target.slice(1)
    window.scrollTo({ top: 0 })
  }, [])

  return { section, param, navigate }
}
