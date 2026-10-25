import { expect, test } from '@playwright/test'
import { ROUTES } from './support/routes'

// Prueba de humo: valida la instalación de Playwright sobre la vista pública de login, sin depender del backend.
test.describe('Login (vista pública)', () => {
  test('carga con SEO y estructura semántica', async ({ page }) => {
    await page.goto(ROUTES.ROOT)

    await expect(page).toHaveTitle(/Iniciar sesión/)
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.getByRole('form', { name: 'Inicio de sesión' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ingresar', exact: true })).toBeVisible()
  })
})
