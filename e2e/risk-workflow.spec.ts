import { expect, test, type Page } from '@playwright/test'
import { ROUTES } from './support/routes'
import { dialog, goTo } from './support/ui'
import { storageStateOf } from './support/users'

test.use({ storageState: storageStateOf('analyst') })

// Versiones pendientes de la semilla (ids estables sobre una BD recién sembrada; ver seed_risks.py).
const WORKSPACE = {
  erpDegradation: 1, // RSG-0001 v1 · 2 fuentes estratégicas
  phishingRecurrence: 3, // RSG-0002 v2 · posible recurrencia
  backupLoss: 7, // RSG-0005 v1 · sin fuentes estratégicas
} as const

const cell = (page: Page, probability: string, impact: string) =>
  page.getByRole('grid', { name: /Matriz de riesgo 5×5/ }).getByRole('button', { name: new RegExp(`^Probabilidad ${probability}, Impacto ${impact},`) })

const requirement = (page: Page, text: string) =>
  page.getByRole('list', { name: 'Requisitos para validar' }).getByRole('listitem').filter({ hasText: text })

const decisionBar = (page: Page) => page.getByRole('region', { name: 'Decisión' })

/** Paso 2: confirma el activo reportado y la agrupación. */
async function confirmGrouping(page: Page, assetLabel: string) {
  const grouping = page.getByRole('form', { name: 'Confirmación del activo y la agrupación' })
  await grouping.getByLabel('Activo afectado definitivo').selectOption({ label: assetLabel })
  await grouping.getByRole('button', { name: /^Confirmar agrupación/ }).click()
  await expect(requirement(page, 'Activo afectado confirmado')).toContainText('completado')
  await expect(requirement(page, 'Agrupación de incidencias confirmada')).toContainText('completado')
}

/** Paso 3: evalúa pulsando una celda de la matriz y justifica. */
async function evaluate(page: Page, probability: string, impact: string, justification: string) {
  await cell(page, probability, impact).click()
  await page.getByLabel('Justificación de la evaluación').fill(justification)
  await page.getByRole('button', { name: 'Guardar evaluación' }).click()
  await expect(requirement(page, 'Evaluación guardada en la matriz')).toContainText('completado')
  await expect(page.getByRole('button', { name: 'Actualizar evaluación' })).toBeVisible()
}

test.describe('Gobierno de riesgos: revisión, evaluación y decisión del Analista', () => {
  test('depura la agrupación, confirma el activo, evalúa en la matriz y valida RSG-0001', async ({ page }) => {
    await page.goto(ROUTES.PROPOSAL_WORKSPACE(WORKSPACE.erpDegradation))
    await expect(page.getByRole('heading', { level: 1, name: 'Degradación del servicio del ERP Contable' })).toBeVisible()
    await expect(decisionBar(page).getByRole('button', { name: 'Validar' })).toBeDisabled()
    await expect(page.getByText(/^Para validar:/)).toContainText('Confirma el activo afectado')

    // Paso 1: retirar un falso positivo (la impresora no pertenece al riesgo del ERP) y restaurarlo.
    const included = page.getByRole('list', { name: 'Incidencias incluidas en la agrupación' })
    const printer = included.getByRole('article', { name: 'Impresora lenta al imprimir reportes' })
    await printer.getByRole('button', { name: /^Retirar INC-\d+ de la agrupación$/ }).click()
    const removal = dialog(page, 'Retirar de la agrupación')
    await removal.getByRole('button', { name: 'Retirar incidencia' }).click()
    await expect(removal.getByText(/Explique el motivo por el cual retira este falso positivo/)).toBeVisible()
    await removal.getByLabel('Motivo del retiro', { exact: true }).fill('La impresora no forma parte del servicio ERP Contable.')
    await removal.getByRole('button', { name: 'Retirar incidencia' }).click()
    await expect(removal).toBeHidden()
    await expect(printer).toHaveCount(0)

    await page.getByRole('button', { name: /^Excluidas de la agrupación \(1\)/ }).click()
    const excluded = page.getByRole('list', { name: 'Incidencias excluidas de la agrupación' })
    await expect(excluded).toContainText('La impresora no forma parte del servicio ERP Contable.')
    await excluded.getByRole('button', { name: /^Restaurar INC-\d+ a la agrupación$/ }).click()
    await expect(included.getByRole('article', { name: 'Impresora lenta al imprimir reportes' })).toBeVisible()

    // Paso 2: elegir otro activo exige justificación; con el reportado se confirma la agrupación.
    const grouping = page.getByRole('form', { name: 'Confirmación del activo y la agrupación' })
    await grouping.getByLabel('Activo afectado definitivo').selectOption({ label: 'Servidor de archivos' })
    await grouping.getByRole('button', { name: /^Confirmar agrupación/ }).click()
    await expect(grouping.getByText('El activo elegido difiere del reportado en las incidencias: justifique el cambio')).toBeVisible()
    await confirmGrouping(page, 'ERP Contable (reportado)')
    await expect(page.getByRole('button', { name: 'Cambiar activo confirmado' })).toBeVisible()

    // Paso 3: validaciones, selección con ratón y con teclado sobre la matriz 5×5.
    await page.getByRole('button', { name: 'Guardar evaluación' }).click()
    await expect(page.getByText('Seleccione un nivel de probabilidad (1 a 5)')).toBeVisible()
    await cell(page, '4 Probable', '3 Moderado').click()
    await expect(page.getByRole('status').filter({ hasText: 'Nivel resultante' })).toContainText('Alto')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('status').filter({ hasText: 'Nivel resultante' })).toContainText('Crítico')
    await page.getByLabel('Justificación de la evaluación').fill('Corto')
    await page.getByRole('button', { name: 'Guardar evaluación' }).click()
    await expect(page.getByText('La justificación de evaluación en matriz debe tener al menos 15 caracteres')).toBeVisible()
    await page.getByLabel('Justificación de la evaluación').fill('Recurrencia alta de lentitud en el ERP con impacto mayor sobre el cierre contable.')
    await page.getByRole('button', { name: 'Guardar evaluación' }).click()
    await expect(requirement(page, 'Evaluación guardada en la matriz')).toContainText('completado')

    // Fuentes estratégicas: se consultan antes de decidir.
    await page.getByRole('button', { name: /^Consultar fuente 1:/ }).click()
    const drawer = page.getByRole('complementary', { name: 'Inspección de fuente documental citada' })
    await expect(drawer).toBeVisible()
    await drawer.getByRole('button', { name: 'Cerrar panel de cita normativa' }).click()
    await expect(drawer).toBeHidden()

    // Paso 4: decisión.
    await decisionBar(page).getByRole('checkbox', { name: 'Revisé el contenido, las incidencias y las fuentes.' }).check()
    await decisionBar(page).getByRole('button', { name: 'Validar' }).click()
    const validate = dialog(page, 'Validar propuesta')
    await validate.getByRole('button', { name: 'Registrar validación' }).click()
    await expect(validate.getByRole('alert').first()).toBeVisible()
    await validate.getByLabel('Observación').fill('Riesgo confirmado con la evidencia de recurrencia y las fuentes citadas.')
    await validate.getByRole('button', { name: 'Registrar validación' }).click()
    await expect(validate).toBeHidden()
    await expect(page.getByText(/Esta versión ya tiene una decisión registrada y es inmutable/)).toBeVisible()
    await expect(page.getByRole('main').getByText('Validada').first()).toBeVisible()
    await expect(decisionBar(page)).toHaveCount(0)

    await page.getByRole('button', { name: 'Ver detalle del riesgo' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Degradación del servicio del ERP Contable' })).toBeVisible()
    await expect(page.getByRole('main')).toContainText('Crítico')
  })

  test('valida RSG-0005 sin fuentes estratégicas exigiendo la justificación correspondiente', async ({ page }) => {
    await page.goto(ROUTES.PROPOSAL_WORKSPACE(WORKSPACE.backupLoss))
    await expect(requirement(page, 'Sin fuentes: requerirá justificación')).toContainText('pendiente')
    await expect(page.getByRole('complementary', { name: 'Fuentes estratégicas (0)' })).toBeVisible()
    await confirmGrouping(page, 'Servidor de archivos (reportado)')
    await evaluate(page, '3 Posible', '4 Mayor', 'Las copias de respaldo fallidas comprometen la recuperación de información.')

    await decisionBar(page).getByRole('checkbox', { name: 'Revisé el contenido, las incidencias y las fuentes.' }).check()
    await decisionBar(page).getByRole('button', { name: 'Validar' }).click()
    const validate = dialog(page, 'Validar propuesta')
    await validate.getByLabel('Observación').fill('Se valida por la criticidad del servidor de archivos.')
    await validate.getByRole('button', { name: 'Registrar validación' }).click()
    await expect(validate.getByText('Al no existir fuentes documentales estratégicas citadas, debe justificar la validación sin fuentes')).toBeVisible()
    await validate.getByLabel('Justificación de validación sin fuentes documentales').fill('No existe aún una política de respaldo publicada; se valida con la evidencia del incidente.')
    await validate.getByRole('button', { name: 'Registrar validación' }).click()
    await expect(validate).toBeHidden()
    await expect(page.getByRole('main').getByText('Validada').first()).toBeVisible()
  })

  test('corrige RSG-0002 creando una nueva versión y luego la rechaza conservando el historial', async ({ page }) => {
    await page.goto(ROUTES.PROPOSAL_WORKSPACE(WORKSPACE.phishingRecurrence))
    await expect(page.getByText(/posible recurrencia/i).first()).toBeVisible()

    await decisionBar(page).getByRole('button', { name: 'Corregir' }).click()
    const correct = dialog(page, 'Corregir propuesta')
    await correct.getByLabel('Observación').fill('Se precisa el alcance del riesgo de suplantación.')
    await correct.getByRole('button', { name: 'Guardar corrección' }).click()
    await expect(correct.getByText('Modifique al menos un campo del contenido para crear la nueva versión')).toBeVisible()
    const newTitle = 'Suplantación de identidad mediante correos con adjuntos maliciosos'
    await correct.getByLabel('Riesgo (título)').fill(newTitle)
    await correct.getByRole('button', { name: 'Guardar corrección' }).click()
    await expect(correct).toBeHidden()

    // La corrección abre la versión siguiente (v3), pendiente y a nombre del analista.
    await expect(page.getByRole('heading', { level: 1, name: newTitle })).toBeVisible()
    await expect(page.getByRole('main')).toContainText(/RSG-0002\s*· v3/)
    await expect(page.getByRole('region', { name: 'Versiones' }).getByRole('listitem')).toHaveCount(3)

    await decisionBar(page).getByRole('button', { name: 'Rechazar' }).click()
    const reject = dialog(page, 'Rechazar propuesta')
    await reject.getByRole('button', { name: 'Rechazar propuesta' }).click()
    await expect(reject.getByRole('alert').first()).toBeVisible()
    await reject.getByLabel('Motivo del rechazo').fill('La nueva redacción no aporta evidencia adicional a la versión vigente.')
    await reject.getByRole('button', { name: 'Rechazar propuesta' }).click()
    await expect(reject).toBeHidden()
    await expect(page.getByRole('main').getByText('Rechazada').first()).toBeVisible()

    await goTo(page, 'Propuestas de riesgo', 'Propuestas de riesgo')
    await page.getByRole('tab', { name: /^Rechazadas/ }).click()
    await expect(page.getByRole('main').getByRole('article', { name: newTitle })).toBeVisible()
  })

  test('el registro de riesgos muestra pestañas, detalle, comparación de versiones y fuentes', async ({ page }) => {
    await page.goto(ROUTES.RISKS)
    const kpis = page.getByRole('region', { name: 'Indicadores clave' })
    await expect(kpis).toContainText('Riesgos vigentes')
    const tabs = page.getByRole('tablist', { name: 'Clasificación del registro de riesgos' })
    await tabs.getByRole('tab', { name: /^Propuestas pendientes/ }).click()
    await expect(tabs.getByRole('tab', { name: /^Propuestas pendientes/ })).toHaveAttribute('aria-selected', 'true')
    await tabs.getByRole('tab', { name: /^Rechazados/ }).click()
    await expect(page.getByRole('main').getByRole('table')).toBeVisible()
    await tabs.getByRole('tab', { name: /^Riesgos validados/ }).click()

    await page.getByRole('button', { name: /^Abrir RSG-0003:/ }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Acceso remoto no autorizado a la VPN' })).toBeVisible()
    const versions = page.getByRole('region', { name: 'Versiones' })
    await versions.getByRole('button', { name: /^Versión 2/ }).click()
    await versions.getByRole('button', { name: 'Comparar con versión anterior' }).click()
    await expect(versions.getByRole('table')).toBeVisible()
    await versions.getByRole('button', { name: 'Ocultar comparación' }).click()
    await expect(versions.getByRole('table')).toHaveCount(0)

    await page.getByRole('button', { name: 'Registro de riesgos' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Registro de riesgos' })).toBeVisible()
  })
})
