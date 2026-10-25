import { expect, test } from '@playwright/test'
import { ROUTES } from './support/routes'
import { goTo, submitLogin } from './support/ui'
import { USERS, storageStateOf } from './support/users'

const ERP_PROPOSAL = { versionId: 1, title: 'Degradación del servicio del ERP Contable' } // RSG-0001 v1 (seed)

const pathOf = (url: string) => new URL(url).pathname

test.describe('Enrutado: enlaces directos, sesión y permisos', () => {
  test('un enlace directo sin sesión pasa por el login y vuelve a la vista pedida', async ({ page }) => {
    await page.goto(ROUTES.PROPOSAL_WORKSPACE(ERP_PROPOSAL.versionId))
    await expect(page).toHaveURL((url) => url.pathname === ROUTES.LOGIN)
    await expect(page.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeVisible()

    await submitLogin(page, 'analyst')
    await expect(page).toHaveURL((url) => url.pathname === ROUTES.PROPOSAL_WORKSPACE(ERP_PROPOSAL.versionId))
    await expect(page.getByRole('heading', { level: 1, name: ERP_PROPOSAL.title })).toBeVisible()
  })

  test.describe('con sesión de Analista', () => {
    test.use({ storageState: storageStateOf('analyst') })

    test('recargar un detalle conserva la vista y resalta su sección de origen', async ({ page }) => {
      await page.goto(ROUTES.PROPOSAL_WORKSPACE(ERP_PROPOSAL.versionId))
      await expect(page.getByRole('heading', { level: 1, name: ERP_PROPOSAL.title })).toBeVisible()
      await page.reload()
      await expect(page.getByRole('heading', { level: 1, name: ERP_PROPOSAL.title })).toBeVisible()
      await expect(page.getByRole('navigation').first().getByRole('link', { name: 'Propuestas de riesgo', exact: true })).toHaveAttribute('aria-current', 'page')
    })

    test('el login con sesión activa y la raíz llevan al inicio del portal', async ({ page }) => {
      await page.goto(ROUTES.LOGIN)
      await expect(page).toHaveURL((url) => url.pathname === ROUTES.DASHBOARD)
      await page.goto(ROUTES.ROOT)
      await expect(page).toHaveURL((url) => url.pathname === ROUTES.DASHBOARD)
      await expect(page.getByRole('banner')).toContainText(USERS.analyst.fullName)
    })

    test('atrás y adelante del navegador recorren las secciones visitadas', async ({ page }) => {
      await page.goto(ROUTES.RISKS)
      await expect(page.getByRole('heading', { level: 1, name: 'Registro de riesgos' })).toBeVisible()
      await goTo(page, 'Propuestas de riesgo', 'Propuestas de riesgo')
      expect(pathOf(page.url())).toBe(ROUTES.PROPOSALS)

      await page.goBack()
      await expect(page.getByRole('heading', { level: 1, name: 'Registro de riesgos' })).toBeVisible()
      await page.goForward()
      await expect(page.getByRole('heading', { level: 1, name: 'Propuestas de riesgo' })).toBeVisible()
    })
  })

  test.describe('con sesión de Administrador', () => {
    test.use({ storageState: storageStateOf('admin') })

    test('no puede abrir por URL la cola de atención ni un caso N2 (INV-05)', async ({ page }) => {
      for (const route of [ROUTES.SUPPORT, ROUTES.SUPPORT_CASE(1)]) {
        await page.goto(route)
        await expect(page).toHaveURL((url) => url.pathname === ROUTES.DASHBOARD)
        await expect(page.getByRole('heading', { level: 1, name: 'Panel de administración' })).toBeVisible()
      }
    })
  })

  test.describe('con sesión de Reportante', () => {
    test.use({ storageState: storageStateOf('reporter') })

    test('una ruta inexistente o de otro rol redirige a su inicio', async ({ page }) => {
      for (const route of ['/ruta-inexistente', ROUTES.RISKS, ROUTES.DOCUMENTS]) {
        await page.goto(route)
        await expect(page).toHaveURL((url) => url.pathname === ROUTES.HOME)
        await expect(page.getByRole('heading', { level: 1, name: USERS.reporter.firstName })).toBeVisible()
      }
    })
  })
})
