import { expect, test, type Page } from '@playwright/test'
import { normativePdf } from './support/files'
import { ROUTES } from './support/routes'
import { dialog, goTo, logout, uniqueSuffix } from './support/ui'
import { storageStateOf } from './support/users'

test.use({ storageState: storageStateOf('admin') })
// Las pruebas del archivo comparten datos creados en orden (p. ej. el activo nuevo se busca luego en auditoría).
test.describe.configure({ mode: 'serial' })

const RUN = uniqueSuffix()
const ASSET = { code: `ACT-E2E-${RUN}`, name: `Portal de proveedores ${RUN}` }
const DOC = { code: `POL-E2E-${RUN}`.slice(0, 50), title: `Política de pruebas automatizadas ${RUN}` }
// El procesamiento real del PDF (PyMuPDF4LLM -> chunks -> embeddings) corre en Celery; la tarjeta se refresca cada 3 s.
const PROCESSING_TIMEOUT = 120_000

const docCard = (page: Page, title: string) => page.getByRole('main').getByRole('article', { name: title })

async function uploadPdf(page: Page, opener: () => Promise<void>, fields: { code?: string; version: string; title?: string }, pdfLines: string[]) {
  await opener()
  const form = page.getByRole('dialog', { name: /Cargar (PDF normativo|nueva versión)/ })
  if (fields.code) await form.getByLabel('Código').fill(fields.code)
  await form.getByLabel('Versión').fill(fields.version)
  if (fields.title) await form.getByLabel('Título').fill(fields.title)
  if (fields.code) await form.getByLabel('Finalidad').selectOption({ index: 0 })
  const chooser = page.waitForEvent('filechooser')
  await form.getByRole('region', { name: 'Zona para arrastrar o seleccionar un PDF' }).click()
  await (await chooser).setFiles(normativePdf(`${DOC.code}-${fields.version}.pdf`, pdfLines))
  await form.getByRole('button', { name: 'Cargar PDF' }).click()
  await expect(form).toBeHidden()
}

test.describe('Portal del Administrador', () => {
  test('el panel muestra indicadores y el estado del sistema, y enlaza a Documentos', async ({ page }) => {
    await page.goto(ROUTES.ROOT)
    await expect(page.getByRole('heading', { level: 1, name: 'Panel de administración' })).toBeVisible()
    const main = page.getByRole('main')
    for (const kpi of ['Incidencias registradas', 'En atención humana', 'Riesgos vigentes', 'Propuestas pendientes']) {
      await expect(main.getByRole('heading', { level: 3, name: kpi, exact: true })).toBeVisible()
    }
    await expect(main).toContainText('Configuración IA vigente')
    await main.getByRole('button', { name: 'Revisar documentos' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Documentos' })).toBeVisible()
  })

  test('registra, edita y desactiva un activo del catálogo', async ({ page }) => {
    await page.goto(ROUTES.ASSETS)
    await page.getByRole('button', { name: 'Nuevo activo' }).click()
    const form = dialog(page, 'Nuevo activo')
    await form.getByRole('button', { name: 'Guardar' }).click()
    await expect(form.getByRole('alert').first()).toBeVisible()

    await form.getByLabel('Código').fill(ASSET.code.toLowerCase())
    await form.getByLabel('Tipo').selectOption({ label: 'Aplicación' })
    await form.getByLabel('Nombre').fill(ASSET.name)
    await form.getByLabel('Criticidad').selectOption({ label: 'Alto' })
    await form.getByLabel('Descripción').fill('Portal web donde los proveedores cargan sus facturas.')
    await form.getByRole('button', { name: 'Guardar' }).click()
    await expect(form).toBeHidden()

    const table = page.getByRole('table', { name: 'Catálogo de activos de información' })
    const row = table.getByRole('row').filter({ hasText: ASSET.name })
    await expect(row).toContainText(ASSET.code) // el código se guarda en mayúsculas

    await row.getByRole('button', { name: `Editar ${ASSET.name}` }).click()
    const edit = dialog(page, 'Editar activo')
    await expect(edit.getByLabel('Código')).toHaveValue(ASSET.code)
    await edit.getByLabel('Criticidad').selectOption({ label: 'Crítico' })
    await edit.getByRole('button', { name: 'Guardar' }).click()
    await expect(edit).toBeHidden()
    await expect(row).toContainText('Crítico')

    await row.getByRole('switch', { name: `Desactivar ${ASSET.name}` }).click()
    await expect(row.getByRole('switch', { name: `Activar ${ASSET.name}` })).not.toBeChecked()
    await expect(row).toContainText('Inactivo')
  })

  test('edita celdas de la matriz, descarta y publica una nueva versión', async ({ page }) => {
    await page.goto(ROUTES.MATRIX)
    const publish = page.getByRole('button', { name: 'Guardar como nueva versión' })
    const discard = page.getByRole('button', { name: 'Descartar cambios' })
    await expect(publish).toBeDisabled()

    // Solo se toca P1×I1, que no usan las evaluaciones de risk-workflow.spec.ts.
    const lowCell = page.getByRole('button', { name: /^Probabilidad 1 Rara, impacto 1 Insignificante: / })
    const original = await lowCell.innerText()
    await lowCell.click()
    await expect(lowCell).not.toHaveText(original)
    await expect(lowCell).toHaveAccessibleName(/, modificado\./)
    await expect(page.getByRole('status').filter({ hasText: '1 celda modificada' })).toBeVisible()
    await discard.click()
    await expect(lowCell).toHaveText(original)

    await lowCell.focus()
    await page.keyboard.press('Enter')
    await expect(lowCell).not.toHaveText(original)
    await publish.click()
    const publishDialog = dialog(page, 'Guardar como nueva versión')
    await publishDialog.getByLabel('Nombre de la configuración').fill('ab')
    await publishDialog.getByRole('button', { name: 'Publicar versión' }).click()
    await expect(publishDialog.getByText('Ingresa un nombre de al menos 3 caracteres')).toBeVisible()
    await publishDialog.getByLabel('Nombre de la configuración').fill(`Matriz E2E ${RUN}`)
    await publishDialog.getByRole('button', { name: 'Publicar versión' }).click()
    await expect(publishDialog).toBeHidden()
    await expect(page.getByRole('main')).toContainText(`Matriz E2E ${RUN}`)
    await expect(publish).toBeDisabled()

    await page.getByRole('tab', { name: 'Probabilidad' }).click()
    await expect(page.getByRole('main')).toContainText('Casi segura')
  })

  test('carga un PDF normativo, lo procesa, previsualiza, autoriza, desactiva, reactiva y versiona', async ({ page }) => {
    test.setTimeout(PROCESSING_TIMEOUT * 3)
    await page.goto(ROUTES.DOCUMENTS)

    // Validaciones del formulario.
    await page.getByRole('button', { name: 'Cargar PDF' }).click()
    const form = dialog(page, 'Cargar PDF normativo')
    await form.getByRole('button', { name: 'Cargar PDF' }).click()
    await expect(form.getByText('El código del documento es obligatorio (ej. POL-SGSI-01)')).toBeVisible()
    await expect(form.getByText('La versión es obligatoria (ej. v1.0)')).toBeVisible()
    await form.getByRole('button', { name: 'Cancelar' }).click()

    const lines = [`Politica de pruebas automatizadas ${RUN}`, 'Seccion 1. Alcance de las pruebas de extremo a extremo.', 'Seccion 2. Responsables de mantener la suite de regresion.']
    await uploadPdf(page, () => page.getByRole('button', { name: 'Cargar PDF' }).click(), { code: DOC.code, version: 'v1.0', title: DOC.title }, lines)

    const card = docCard(page, DOC.title)
    await expect(card).toBeVisible()
    await expect(card.getByRole('button', { name: 'Previsualizar y autorizar' })).toBeVisible({ timeout: PROCESSING_TIMEOUT })
    await expect(card).toContainText('Pendiente de autorización')

    await card.getByRole('button', { name: 'Previsualizar y autorizar' }).click()
    const preview = dialog(page, new RegExp(`^${DOC.code} · v1\\.0`))
    await preview.getByRole('complementary', { name: 'Fragmentos de la versión' }).getByRole('button', { name: /^Fragmento #1/ }).click()
    // Cada fragmento lleva el prefijo de trazabilidad del pipeline RAG.
    await expect(preview.getByRole('article', { name: 'Fragmento 1' })).toContainText(`[Documento: ${DOC.code} v1.0 | Sección:`)
    await preview.getByRole('tab', { name: 'Markdown crudo' }).click()
    await expect(preview.getByRole('tab', { name: 'Markdown crudo' })).toHaveAttribute('aria-selected', 'true')
    await expect(preview).toContainText('Seccion 1')
    await preview.getByRole('button', { name: 'Autorizar y activar versión' }).click()
    await expect(preview).toBeHidden()
    await expect(card).toContainText('Disponible en RAG')

    await card.getByRole('button', { name: 'Desactivar' }).click()
    await expect(card).toContainText('Autorizado · inactivo')
    await card.getByRole('button', { name: 'Activar' }).click()
    await expect(card).toContainText('Disponible en RAG')
    // Se deja inactivo para no alterar la orientación operativa del resto de la suite.
    await card.getByRole('button', { name: 'Desactivar' }).click()
    await expect(card).toContainText('Autorizado · inactivo')

    await card.getByRole('button', { name: 'Ver fragmentos' }).click()
    const fragments = dialog(page, new RegExp(`^${DOC.code} · v1\\.0`))
    await expect(fragments.getByRole('button', { name: 'Autorizar y activar versión' })).toHaveCount(0)
    await fragments.getByRole('button', { name: 'Cerrar' }).first().click()

    await uploadPdf(page, () => card.getByRole('button', { name: 'Nueva versión' }).click(), { version: 'v2.0' }, [...lines, 'Seccion 3. Cambios introducidos en la version 2.0.'])
    const versionTwo = page.getByRole('main').getByRole('article').filter({ hasText: `${DOC.code} · versión v2.0` })
    await expect(versionTwo).toBeVisible()
    await expect(versionTwo.getByRole('button', { name: 'Previsualizar y autorizar' })).toBeVisible({ timeout: PROCESSING_TIMEOUT })

    await page.getByRole('searchbox', { name: 'Buscar documentos por código, título o versión' }).fill(DOC.code)
    await expect(page.getByRole('main').getByRole('article')).toHaveCount(2)
  })

  test('reintenta el procesamiento de un PDF con error y muestra el motivo', async ({ page }) => {
    await page.goto(ROUTES.DOCUMENTS)
    const failed = docCard(page, 'Plan de respuesta ante incidentes')
    await expect(failed.getByRole('alert')).toContainText('capa de texto')
    await failed.getByRole('button', { name: 'Reintentar' }).click()
    await expect(failed.getByRole('alert')).toContainText('capa de texto', { timeout: PROCESSING_TIMEOUT })
    await expect(failed.getByRole('button', { name: 'Reintentar' })).toBeVisible()
  })

  test('valida, prueba la conexión y publica una nueva configuración IA/RAG', async ({ page }) => {
    await page.goto(ROUTES.AI_CONFIG)
    const publish = page.getByRole('button', { name: 'Publicar nueva versión' })
    await expect(publish).toBeDisabled()

    await page.getByRole('spinbutton', { name: 'Solapamiento' }).fill('500')
    await expect(page.getByText('El solapamiento (chunk_overlap) debe ser estrictamente menor a la mitad del chunk_size')).toBeVisible()
    await page.getByRole('spinbutton', { name: 'Solapamiento' }).fill('120')

    await page.getByRole('button', { name: 'Probar conexión' }).click()
    const diagnostics = page.getByRole('region', { name: 'Diagnóstico de conectividad' }).or(page.getByRole('heading', { name: 'Diagnóstico de conectividad' }).locator('..'))
    await expect(diagnostics.first()).toContainText(/ms|Error|dimensiones/i, { timeout: 60_000 })

    // Solo cambia el nombre del modelo: sin API key la IA sigue en modo determinista para el resto de la suite.
    await page.getByRole('group', { name: 'Modelo de lenguaje (LLM)' }).getByRole('textbox', { name: 'Modelo' }).fill('gemini-2.5-flash-lite')
    await expect(publish).toBeEnabled()
    await publish.click()
    await expect(page.getByRole('main')).toContainText(/v\d/)
    await expect(publish).toBeDisabled()
  })

  test('crea un usuario, el usuario inicia sesión y deja de poder hacerlo al desactivarlo', async ({ page, browser }) => {
    const email = `qa.e2e.${RUN.toLowerCase()}@empresa.pe`
    const password = `Pruebas#${RUN}2026`
    await page.goto(ROUTES.USERS)
    await page.getByRole('button', { name: 'Nuevo usuario' }).click()
    const form = dialog(page, 'Nuevo usuario')
    await form.getByLabel('Nombres').fill('Quinto')
    await form.getByLabel('Apellidos').fill(`Pruebas ${RUN}`)
    await form.getByLabel('Correo').fill(email)
    await form.getByLabel('Rol').selectOption({ label: 'Reportante' })
    await form.getByLabel('Contraseña inicial').fill('corta')
    await form.getByRole('button', { name: 'Guardar' }).click()
    await expect(form.getByRole('alert').first()).toBeVisible()
    await form.getByLabel('Contraseña inicial').fill(password)
    await form.getByRole('button', { name: 'Guardar' }).click()
    await expect(form).toBeHidden()

    const fullName = `Quinto Pruebas ${RUN}`
    await expect(page.getByRole('main')).toContainText(email)
    // El último administrador activo y el propio acceso están protegidos.
    await expect(page.getByRole('switch', { name: /Carla Mendoza: No puedes retirarte/ })).toBeDisabled()

    // El nuevo usuario inicia sesión como lo haría una persona.
    const userContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const userPage = await userContext.newPage()
    await userPage.goto(ROUTES.ROOT)
    await userPage.getByLabel('Correo institucional').fill(email)
    await userPage.getByLabel('Contraseña', { exact: true }).fill(password)
    await userPage.getByRole('button', { name: 'Ingresar', exact: true }).click()
    await expect(userPage.getByRole('banner')).toContainText(fullName)
    await logout(userPage)

    await page.getByRole('button', { name: `Editar a ${fullName}` }).click()
    const edit = dialog(page, 'Editar usuario')
    await expect(edit.getByLabel('Correo')).toHaveValue(email)
    await edit.getByRole('button', { name: 'Cancelar' }).click()

    await page.getByRole('switch', { name: `Desactivar a ${fullName}` }).click()
    await expect(page.getByRole('switch', { name: `Activar a ${fullName}` })).not.toBeChecked()

    await userPage.getByLabel('Correo institucional').fill(email)
    await userPage.getByLabel('Contraseña', { exact: true }).fill(password)
    await userPage.getByRole('button', { name: 'Ingresar', exact: true }).click()
    await expect(userPage.getByRole('form', { name: 'Inicio de sesión' }).getByRole('alert').first()).toBeVisible()
    await expect(userPage.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeVisible()
    await userContext.close()
  })

  test('crea un rol, ajusta sus permisos y respeta la segregación de funciones', async ({ page }) => {
    const roleName = `Auditor TI ${RUN}`
    await page.goto(ROUTES.ROLES)

    // SoD (ISO 27001): el rol Administrador no puede recibir permisos de evaluación de riesgos.
    await page.getByRole('button', { name: /^Administrador Rol del sistema/ }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Administrador' })).toBeVisible()
    await expect(page.getByRole('switch', { name: /^Evaluar riesgos/ })).toBeDisabled()

    await page.getByRole('button', { name: 'Nuevo rol' }).click()
    const form = dialog(page, 'Nuevo rol')
    await form.getByLabel('Nombre del rol').fill(roleName)
    await form.getByLabel('Código').fill(`AUDITOR_${RUN}`)
    await form.getByRole('button', { name: 'Crear rol' }).click()
    await expect(form).toBeHidden()
    await expect(page.getByRole('heading', { level: 2, name: roleName })).toBeVisible()

    await page.getByRole('switch', { name: 'Consultar riesgos e indicadores' }).click()
    await page.getByRole('switch', { name: 'Ver todas las incidencias' }).click()
    await expect(page.getByRole('button', { name: 'Descartar' })).toBeEnabled()
    await page.getByRole('button', { name: 'Revisar y guardar' }).click()
    const summary = page.getByRole('dialog', { name: /Resumen de cambios/ })
    await expect(summary).toContainText('Consultar riesgos e indicadores')
    await summary.getByRole('button', { name: 'Guardar permisos' }).click()
    await expect(summary).toBeHidden()
    await expect(page.getByRole('button', { name: new RegExp(`^${roleName} .*2 permisos`) })).toBeVisible()
  })

  test('la auditoría registra las acciones críticas y permite buscarlas', async ({ page }) => {
    await page.goto(ROUTES.AUDIT)
    await page.getByRole('searchbox', { name: 'Buscar en acción o detalle' }).fill(ASSET.code)
    await page.getByRole('button', { name: 'Buscar' }).click()
    const events = page.getByRole('main').getByRole('table')
    await expect(events.getByRole('rowgroup').nth(1).getByRole('row').first()).toContainText(ASSET.code)
    await expect(page.getByRole('main')).toContainText(/eventos?/i)

    await page.getByRole('searchbox', { name: 'Buscar en acción o detalle' }).fill('')
    await page.getByRole('combobox', { name: 'Filtrar por acción' }).selectOption({ index: 1 })
    await expect(events.getByRole('rowgroup').nth(1).getByRole('row').first()).toBeVisible()
  })

  test('consulta incidencias y propuestas solo en modo lectura', async ({ page }) => {
    await goToIncidentAsAdmin(page)
    // SoD: el panel N2 informa que el rol no puede atender casos y no ofrece acciones.
    const attention = page.getByRole('region', { name: 'Atención de incidencias (N2)' })
    await expect(attention).toContainText('Tu rol no tiene permiso para atender casos.')
    await expect(attention.getByRole('button')).toHaveCount(0)
    await expect(page.getByRole('form', { name: 'Registro de la atención N2' })).toHaveCount(0)

    await goTo(page, 'Propuestas de riesgo', 'Propuestas de riesgo')
    await expect(page.getByRole('main')).toContainText('Modo lectura')
    await page.getByRole('main').getByRole('heading', { level: 3 }).first().getByRole('button').click()
    await expect(page.getByRole('button', { name: 'Validar' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^Retirar INC-/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Guardar evaluación' })).toHaveCount(0)
  })
})

async function goToIncidentAsAdmin(page: Page) {
  await page.goto(ROUTES.INCIDENTS)
  await page.getByRole('table').getByRole('rowgroup').nth(1).getByRole('row').first().getByRole('button', { name: /^Ver / }).click()
  await expect(page.getByRole('button', { name: 'Incidencias' })).toBeVisible()
}

