import { UI_TIMINGS } from '@/constants/timing.constants'
/** Entrega un Blob al navegador como descarga y libera la URL temporal. */
export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), UI_TIMINGS.OBJECT_URL_REVOKE_MS)
}
