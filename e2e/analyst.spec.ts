import { expect, test, type Browser, type Page } from '@playwright/test'
import { GUIDANCE_TIMEOUT, GUIDED_INCIDENT, reportIncident } from './support/incidents'
import { ROUTES } from './support/routes'
import { goTo } from './support/ui'
import { USERS, storageStateOf, type UserKey } from './support/users'

test.use({ storageState: storageStateOf('analyst') })

async function openAs(browser: Browser, user: UserKey, route: string = ROUTES.ROOT): Promise<Page> {
  const context = await browser.newContext({ storageState: storageStateOf(user) })
  const page = await context.newPage()
  await page.goto(route)
  return page
}

/** El Reportante registra un caso y responde «No funcionó» para que llegue a la cola N2; devuelve su referencia. */
async function reporterEscalatesCase(browser: Browser): Promise<{ reporter: Page; reference: string }> {
  const reporter = await openAs(browser, 'reporter')
  const reference = await reportIncident(reporter, GUIDED_INCIDENT)
  await reporter.getByRole('button', { name: 'No funcionó, escalar a un analista' }).click({ timeout: GUIDANCE_TIMEOUT })
  await expect(reporter.getByText('Tu caso está en la cola de atención')).toBeVisible()
  return { reporter, reference }
}

const attentionPanel = (page: Page) => page.getByRole('region', { name: 'Atención de incidencias (N2)' })

test.describe('Consola del Analista: operación N2', () => {
  test('atiende un caso escalado de principio a fin y el reportante ve la resolución', async ({ page, browser }) => {
    const { title } = GUIDED_INCIDENT
    const { reporter, reference } = await reporterEscalatesCase(browser)

    await page.goto(ROUTES.ROOT)
    await goTo(page, 'Atención de incidencias', 'Atención de incidencias')
    await page.getByRole('searchbox', { name: 'Buscar' }).fill(reference)
    const queue = page.getByRole('table', { name: /Cola de atención humana/ })
    await expect(queue.getByRole('rowgroup').nth(1).getByRole('row')).toHaveCount(1)
    await expect(queue).toContainText('No solucionó')
    await queue.getByRole('button', { name: `Atender ${reference}: ${title}` }).click()

    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Historial de orientación IA previa' }).first()).toContainText('no solucionaron el problema')
    await attentionPanel(page).getByRole('button', { name: 'Iniciar atención' }).click()

    const form = page.getByRole('form', { name: 'Registro de la atención N2' })
    await expect(form).toBeVisible()
    await form.getByRole('button', { name: 'Cerrar incidencia' }).click()
    await expect(form.getByText('Para cerrar el caso debe detallar las acciones realizadas (mínimo 10 caracteres)')).toBeVisible()
    await expect(form.getByText('Para cerrar el caso debe registrar la nota de resolución (mínimo 10 caracteres)')).toBeVisible()

    await form.getByLabel('Acciones realizadas').fill('Se depuró la caché del cliente ERP y se reinició el servicio de facturación.')
    await form.getByRole('button', { name: 'Guardar nota' }).click()
    await expect(page.getByRole('main').getByText('En atención').first()).toBeVisible()

    // Otro analista ve quién atiende el caso, sin formulario para registrar la atención.
    const other = await openAs(browser, 'analyst2', new URL(page.url()).pathname)
    await expect(attentionPanel(other)).toContainText(USERS.analyst.fullName)
    await expect(other.getByRole('form', { name: 'Registro de la atención N2' })).toHaveCount(0)
    await other.context().close()

    const resolution = 'Se normalizó el tiempo de guardado de facturas tras depurar la caché del cliente ERP.'
    await form.getByLabel('Nota de resolución').fill(resolution)
    await form.getByRole('button', { name: 'Cerrar incidencia' }).click()
    await expect(page.getByRole('main').getByText('Cerrada').first()).toBeVisible()
    await expect(page.getByRole('form', { name: 'Registro de la atención N2' })).toHaveCount(0)

    await reporter.reload()
    await expect(reporter.getByText('Resolución de la atención')).toBeVisible()
    await expect(reporter.getByRole('main')).toContainText(resolution)
    await expect(reporter.getByRole('complementary', { name: 'Estado del caso' })).toContainText('Cerrada')
    await reporter.context().close()
  })

  test('reintenta un análisis de riesgo fallido sin modificar la incidencia', async ({ page }) => {
    await page.goto(ROUTES.SUPPORT)
    await page.getByRole('button', { name: 'Atender INC-0015: Laptop se reinicia sola' }).click()
    const status = page.getByRole('region', { name: 'Estado operativo y estratégico' })
    await expect(status).toContainText('Falló el servicio de análisis')
    await status.getByRole('button', { name: 'Reintentar análisis' }).click()
    await expect(status.getByRole('button', { name: 'Reintentar análisis' })).toHaveCount(0, { timeout: GUIDANCE_TIMEOUT })
    await expect(status).toContainText('Intento 2')
    await expect(status).toContainText('Pendiente de atención')
  })

  test('la cola y el historial filtran por estado, activo y antigüedad', async ({ page }) => {
    await page.goto(ROUTES.SUPPORT)
    const rows = page.getByRole('table').getByRole('rowgroup').nth(1).getByRole('row')
    const clear = page.getByRole('button', { name: 'Limpiar' })
    await expect(clear).toBeDisabled()

    await page.getByRole('combobox', { name: 'Estado' }).selectOption({ label: 'En atención' })
    await expect(rows.first()).toBeVisible()
    await expect(rows.filter({ hasNotText: 'En atención' })).toHaveCount(0)
    await expect(clear).toBeEnabled()

    await page.getByRole('combobox', { name: 'Activo' }).selectOption({ label: 'ERP Contable' })
    await expect(rows.filter({ hasNotText: 'ERP Contable' })).toHaveCount(0)
    await page.getByRole('combobox', { name: 'Antigüedad' }).selectOption({ label: 'Menos de 30 días' })
    await clear.click()
    await expect(page.getByRole('combobox', { name: 'Estado' }).locator('option:checked')).toHaveText('Todos')
    await expect(clear).toBeDisabled()

    // Historial completo: incluye casos cerrados y se abre con «Ver».
    await goTo(page, 'Incidencias', 'Incidencias')
    await page.getByRole('combobox', { name: 'Estado' }).selectOption({ label: 'Cerrada' })
    await rows.first().getByRole('button', { name: /^Ver / }).click()
    await expect(page.getByRole('button', { name: 'Incidencias' })).toBeVisible()
    await expect(page.getByRole('main').getByText('Cerrada').first()).toBeVisible()
    await expect(attentionPanel(page).getByRole('button', { name: 'Iniciar atención' })).toHaveCount(0)
  })

  test('el resumen filtra por periodo y activo y abre una propuesta pendiente', async ({ page }) => {
    await page.goto(ROUTES.DASHBOARD)
    const filters = page.getByRole('navigation', { name: 'Filtros del resumen' })
    const kpis = page.getByRole('region', { name: 'Indicadores clave' })
    await expect(filters.getByRole('button', { name: 'Últimos 30 días' })).toHaveAttribute('aria-pressed', 'true')

    await filters.getByRole('button', { name: 'Todo' }).click()
    await expect(filters.getByRole('button', { name: 'Todo' })).toHaveAttribute('aria-pressed', 'true')
    await filters.getByRole('combobox', { name: 'Filtrar por activo' }).selectOption({ label: 'VPN corporativa' })
    await expect(kpis.getByRole('article').first()).toBeVisible()
    await filters.getByRole('button', { name: 'Últimos 7 días' }).click()
    await expect(filters.getByRole('button', { name: 'Últimos 7 días' })).toHaveAttribute('aria-pressed', 'true')

    const pending = page.getByRole('article', { name: 'Pendientes de revisión' })
    const proposal = pending.getByRole('button', { name: /^Abrir propuesta RSG-/ }).first()
    const riskCode = (await proposal.getAttribute('aria-label'))?.match(/RSG-\d+/)?.[0] ?? 'RSG-'
    await proposal.click()
    await expect(page).toHaveURL((url) => new RegExp(`^${ROUTES.PROPOSALS}/\\d+$`).test(url.pathname))
    await expect(page.getByRole('main')).toContainText(riskCode)
  })

  test('consulta Activos y Matriz de evaluación en modo solo lectura', async ({ page }) => {
    await page.goto(ROUTES.ASSETS)
    await expect(page.getByRole('heading', { level: 1, name: 'Activos' })).toBeVisible()
    await expect(page.getByRole('main')).toContainText('ERP Contable')
    await expect(page.getByRole('button', { name: 'Nuevo activo' })).toHaveCount(0)
    await expect(page.getByRole('switch')).toHaveCount(0)

    await goTo(page, 'Matriz de evaluación', 'Matriz de evaluación')
    const tabs = page.getByRole('tablist')
    await tabs.getByRole('tab', { name: /Probabilidad/ }).click()
    await expect(page.getByRole('main')).toContainText('Casi segura')
    await tabs.getByRole('tab', { name: /Impacto/ }).click()
    await expect(page.getByRole('main')).toContainText('Severo')
    await expect(page.getByRole('button', { name: 'Guardar como nueva versión' })).toHaveCount(0)
  })
})
