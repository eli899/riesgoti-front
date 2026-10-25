import { expect, type Page } from '@playwright/test'
import type { UploadFile } from './files'
import { dialog } from './ui'

export interface NewIncident {
  title: string
  asset?: string
  otherAsset?: string
  description: string
  files?: UploadFile[]
}

// La rama operativa busca con «título + activo + descripción» y deriva a SIN_RESPALDO si ningún fragmento supera
// umbral_similitud (0.40 en la semilla). Estos textos son FIJOS a propósito: un sufijo aleatorio cambiaría el
// vector de consulta y volvería no determinista el resultado. Similitud medida contra la semilla:
/** 0.513: recibe orientación con citas (SUGERENCIA). */
export const GUIDED_INCIDENT = {
  title: 'VPN corporativa sin conexión',
  asset: 'VPN corporativa',
  description: 'Desde casa la VPN corporativa no conecta y muestra error de tiempo de espera agotado al autenticar.',
} as const satisfies NewIncident

/** 0.256: ningún manual operativo aplica, se deriva sola a un analista (SIN_RESPALDO). */
export const UNSUPPORTED_INCIDENT = {
  title: 'La impresora del piso 3 imprime en blanco',
  asset: 'Impresora multifunción piso 3',
  description: 'La impresora multifunción del piso 3 saca las hojas en blanco al imprimir cualquier documento.',
} as const satisfies NewIncident

// La orientación la prepara Celery en segundo plano; el detalle se refresca solo (polling de 2,5 s).
export const GUIDANCE_TIMEOUT = 90_000

/**
 * Abre «Reportar incidencia», completa el formulario como una persona y lo envía. Devuelve la referencia
 * (INC-XXXX) que muestra el detalle al que redirige el registro.
 */
export async function reportIncident(page: Page, incident: NewIncident): Promise<string> {
  await page.getByRole('button', { name: 'Reportar incidencia' }).first().click()
  const form = dialog(page, 'Reportar incidencia')
  await expect(form).toBeVisible()
  await form.getByLabel('Título breve').fill(incident.title)
  if (incident.otherAsset) {
    await form.getByLabel('Activo afectado').selectOption({ label: 'Otro / No estoy seguro' })
    await form.getByLabel('¿Qué recurso se vio afectado?').fill(incident.otherAsset)
  } else {
    await form.getByLabel('Activo afectado').selectOption({ label: incident.asset ?? 'ERP Contable' })
  }
  await form.getByLabel('Descripción detallada').fill(incident.description)
  if (incident.files?.length) {
    const chooser = page.waitForEvent('filechooser')
    await form.getByRole('region', { name: 'Zona para arrastrar o seleccionar evidencias' }).click()
    await (await chooser).setFiles(incident.files)
  }
  await form.getByRole('button', { name: 'Registrar incidencia' }).click()
  await expect(form).toBeHidden()
  await expect(page.getByRole('heading', { level: 1, name: incident.title })).toBeVisible()
  // La referencia va en su propio <span> dentro del subtítulo «INC-XXXX · Registrada el …».
  const subtitle = page.getByRole('main').getByRole('paragraph').filter({ hasText: 'Registrada el' }).first()
  await expect(subtitle).toContainText(/INC-\d+/)
  return (await subtitle.innerText()).match(/INC-\d+/)![0]
}
