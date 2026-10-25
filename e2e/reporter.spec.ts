import { expect, test, type Page } from '@playwright/test'
import { screenshotPng, textLog } from './support/files'
import { GUIDANCE_TIMEOUT, GUIDED_INCIDENT, UNSUPPORTED_INCIDENT, reportIncident } from './support/incidents'
import { ROUTES } from './support/routes'
import { dialog, goTo, uniqueSuffix } from './support/ui'
import { storageStateOf } from './support/users'

test.use({ storageState: storageStateOf('reporter') })

const statusAside = (page: Page) => page.getByRole('complementary', { name: 'Estado del caso' })

test.describe('Portal del Reportante', () => {
  test('el inicio resume los reportes y lleva al detalle y al listado completo', async ({ page }) => {
    await page.goto(ROUTES.ROOT)
    await expect(page.getByRole('region', { name: 'Resumen de mis reportes' })).toContainText('Reportes registrados')
    const recent = page.getByRole('region', { name: 'Reportes recientes' })
    await expect(recent.getByRole('article')).toHaveCount(4)

    const firstCard = recent.getByRole('article').first()
    const cardTitle = await firstCard.getByRole('heading', { level: 3 }).innerText()
    await firstCard.getByRole('button', { name: /^Ver detalle de INC-/ }).click()
    await expect(page.getByRole('heading', { level: 1, name: cardTitle })).toBeVisible()
    await page.getByRole('button', { name: 'Mis incidencias' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Mis incidencias reportadas' })).toBeVisible()

    await goTo(page, 'Inicio')
    await page.getByRole('button', { name: 'Ver todos' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Mis incidencias reportadas' })).toBeVisible()
  })

  test('el formulario valida cada campo y «Cancelar» cierra sin registrar', async ({ page }) => {
    await page.goto(ROUTES.MY_INCIDENTS)
    const before = await page.getByRole('table').getByRole('caption').innerText()
    await page.getByRole('button', { name: 'Reportar incidencia' }).click()
    const form = dialog(page, 'Reportar incidencia')

    await form.getByRole('button', { name: 'Registrar incidencia' }).click()
    await expect(form.getByText('El título debe describir brevemente el problema (mínimo 5 caracteres)')).toBeVisible()
    await expect(form.getByText('Describa qué ocurrió con al menos 20 caracteres')).toBeVisible()
    await expect(form.getByText('Seleccione un activo del catálogo o especifique el recurso afectado en texto libre')).toBeVisible()

    await form.getByLabel('Activo afectado').selectOption({ label: 'Otro / No estoy seguro' })
    await expect(form.getByLabel('¿Qué recurso se vio afectado?')).toBeVisible()
    await form.getByLabel('Activo afectado').selectOption({ label: 'Correo corporativo' })
    await expect(form.getByLabel('¿Qué recurso se vio afectado?')).toBeHidden()

    const chooser = page.waitForEvent('filechooser')
    await form.getByRole('region', { name: 'Zona para arrastrar o seleccionar evidencias' }).click()
    await (await chooser).setFiles([screenshotPng('pantalla.png'), textLog('error.log', 'Timeout al guardar')])
    const selected = form.getByRole('list', { name: 'Evidencias seleccionadas' })
    await expect(selected.getByRole('listitem')).toHaveCount(2)
    await form.getByRole('button', { name: 'Quitar error.log' }).click()
    await expect(selected.getByRole('listitem')).toHaveCount(1)

    await form.getByRole('button', { name: 'Cancelar' }).click()
    await expect(form).toBeHidden()
    await expect(page.getByRole('table').getByRole('caption')).toHaveText(before)
  })

  test('registra una incidencia con evidencia, recibe la orientación con citas y la cierra con «Sí, funcionó»', async ({ page }) => {
    await page.goto(ROUTES.ROOT)
    await reportIncident(page, { ...GUIDED_INCIDENT, files: [screenshotPng('captura-vpn.png')] })

    const guidance = page.getByRole('article', { name: 'Sugerencia de solución' })
    await expect(guidance).toBeVisible({ timeout: GUIDANCE_TIMEOUT })
    await expect(guidance.getByRole('list', { name: 'Pasos sugeridos' }).getByRole('listitem').first()).toBeVisible()
    const report = page.getByRole('article', { name: 'Reporte original' })
    await expect(report.getByRole('button', { name: 'Descargar captura-vpn.png' })).toBeVisible()

    // Panel de cita normativa: se abre desde «Fuentes consultadas» y se cierra con Esc.
    await guidance.getByRole('navigation', { name: 'Fuentes consultadas' }).getByRole('button').first().click()
    const drawer = page.getByRole('complementary', { name: 'Inspección de fuente documental citada' })
    await expect(drawer).toBeVisible()
    await expect(drawer.getByRole('heading', { level: 2, name: /^Cita \[1\] — / })).toBeVisible()
    await expect(drawer.getByRole('article', { name: /Ubicación Pág/ })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()

    await page.getByRole('button', { name: 'Sí, funcionó (cerrar incidencia)' }).click()
    await expect(page.getByText(/Respuesta registrada el .* no puede modificarse/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sí, funcionó (cerrar incidencia)' })).toHaveCount(0)
    await expect(statusAside(page)).toContainText('Cerrada')
    // INV-02: cerrar por feedback no detiene el análisis de riesgo.
    await expect(statusAside(page)).toContainText('el análisis de riesgo continúa de forma independiente')
    await expect(statusAside(page).getByRole('definition').nth(1)).not.toHaveText(/cancel|anulad/i)
  })

  test('«No funcionó» escala el caso a un analista', async ({ page }) => {
    await page.goto(ROUTES.ROOT)
    await reportIncident(page, GUIDED_INCIDENT)
    await expect(page.getByRole('button', { name: 'No funcionó, escalar a un analista' })).toBeVisible({ timeout: GUIDANCE_TIMEOUT })
    await page.getByRole('button', { name: 'No funcionó, escalar a un analista' }).click()
    await expect(page.getByText('Indicaste que necesitas atención de un analista.')).toBeVisible()
    await expect(page.getByText('Tu caso está en la cola de atención')).toBeVisible()
    await expect(statusAside(page)).toContainText('Pendiente de atención')
  })

  test('sin manuales aplicables el caso se deriva solo a un analista (SIN_RESPALDO)', async ({ page }) => {
    await page.goto(ROUTES.ROOT)
    await reportIncident(page, UNSUPPORTED_INCIDENT)
    // INV-01: la incidencia existe y pasa a PENDIENTE_ATENCION_HUMANA sin que el reportante haga nada.
    await expect(page.getByRole('heading', { level: 2, name: 'Tu caso fue derivado a un analista de soporte' })).toBeVisible({ timeout: GUIDANCE_TIMEOUT })
    await expect(page.getByRole('button', { name: 'No funcionó, escalar a un analista' })).toHaveCount(0)
    await expect(statusAside(page)).toContainText('Pendiente de atención')
    await expect(page.getByRole('article', { name: 'Reporte original' })).toContainText('Sin respaldo documental autorizado')
  })

  test('un reporte con indicios de seguridad se deriva sin pasos técnicos', async ({ page }) => {
    const title = `Correo pide mi contraseña del correo ${uniqueSuffix()}`
    await page.goto(ROUTES.ROOT)
    await reportIncident(page, {
      title,
      otherAsset: 'Cuenta de correo personal en el celular',
      description: 'Recibí un correo que dice ser de soporte y me pide confirmar mi contraseña en un enlace externo.',
    })
    await expect(page.getByRole('heading', { name: /Posible caso de seguridad/ })).toBeVisible({ timeout: GUIDANCE_TIMEOUT })
    await expect(page.getByRole('list', { name: 'Pasos sugeridos' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Sí, funcionó (cerrar incidencia)' })).toHaveCount(0)
  })

  test('«Mis incidencias» busca, filtra por estado, ordena por fecha y pagina', async ({ page }) => {
    await page.goto(ROUTES.MY_INCIDENTS)
    const table = page.getByRole('table')
    const rows = table.getByRole('rowgroup').nth(1).getByRole('row')

    await page.getByRole('searchbox', { name: 'Buscar por referencia, título o descripción' }).fill('INC-0011')
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toContainText('No puedo conectarme a la VPN')

    await page.getByRole('searchbox').fill('texto que no existe en ningún reporte')
    await page.getByRole('button', { name: 'Limpiar filtros' }).click()
    await expect(page.getByRole('searchbox')).toHaveValue('')
    await expect(page.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true')

    await page.getByRole('group', { name: 'Filtrar por estado' }).getByRole('button', { name: 'Cerrada' }).click()
    await expect(rows.first()).toBeVisible()
    for (const row of await rows.all()) await expect(row.getByRole('cell').nth(3)).toHaveText('Cerrada')
    await page.getByRole('button', { name: 'Todas' }).click()

    const firstRef = await rows.first().getByRole('cell').first().innerText()
    await table.getByRole('button', { name: /^Fecha/ }).click()
    await expect(table.getByRole('button', { name: 'Fecha ↑' })).toBeVisible()
    await expect(rows.first().getByRole('cell').first()).not.toHaveText(firstRef)

    // Con las incidencias creadas por la suite el listado supera las 8 filas por página.
    const pager = page.getByRole('navigation', { name: 'Paginación' })
    await expect(pager).toContainText('Página 1 de')
    await pager.getByRole('button').last().click()
    await expect(pager).toContainText('Página 2 de')
  })

  test('por confidencialidad no puede abrir la incidencia de otro reportante', async ({ page }) => {
    await page.goto(ROUTES.MY_INCIDENT_DETAIL(2))
    await expect(page.getByRole('alert')).toContainText('Incidencia no disponible')
    await page.getByRole('button', { name: 'Volver' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Mis incidencias reportadas' })).toBeVisible()
  })
})
