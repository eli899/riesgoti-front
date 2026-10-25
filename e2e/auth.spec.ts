import { expect, test } from '@playwright/test'
import { ROUTES } from './support/routes'
import { goTo, loginAs, logout } from './support/ui'
import { SEED_PASSWORD, USERS } from './support/users'

test.describe('Inicio de sesión y navegación general', () => {
  test('rechaza credenciales inválidas y valida campos vacíos', async ({ page }) => {
    await page.goto(ROUTES.ROOT)
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
    await expect(page.getByRole('form', { name: 'Inicio de sesión' }).getByRole('alert').first()).toBeVisible()

    await page.getByLabel('Correo institucional').fill(USERS.reporter.email)
    await page.getByLabel('Contraseña', { exact: true }).fill('ClaveIncorrecta123')
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
    await expect(page.getByRole('form', { name: 'Inicio de sesión' }).getByRole('alert').first()).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeVisible()
  })

  test('muestra y oculta la contraseña con el icono del ojo', async ({ page }) => {
    await page.goto(ROUTES.ROOT)
    const password = page.getByLabel('Contraseña', { exact: true })
    await password.fill(SEED_PASSWORD)
    await expect(password).toHaveAttribute('type', 'password')
    await page.getByRole('button', { name: 'Mostrar contraseña' }).click()
    await expect(password).toHaveAttribute('type', 'text')
    await page.getByRole('button', { name: 'Ocultar contraseña' }).click()
    await expect(password).toHaveAttribute('type', 'password')
  })

  test('el Reportante entra a su portal, conserva la sesión al recargar y sale con «Salir»', async ({ page }) => {
    await loginAs(page, 'reporter')
    await expect(page.getByRole('heading', { level: 1, name: USERS.reporter.firstName })).toBeVisible()
    const nav = page.getByRole('navigation', { name: /Reportante/ })
    await expect(nav.getByRole('link')).toHaveText(['Inicio', 'Mis incidencias', 'Mi cuenta'])

    await page.reload()
    await expect(page.getByRole('banner')).toContainText(USERS.reporter.fullName)

    await logout(page)
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeVisible()
  })

  test('el Analista ve solo las secciones de su rol', async ({ page }) => {
    await loginAs(page, 'analyst')
    const nav = page.getByRole('navigation').first()
    for (const item of ['Resumen', 'Incidencias', 'Atención de incidencias', 'Propuestas de riesgo', 'Registro de riesgos', 'Activos', 'Matriz de evaluación', 'Mi cuenta']) {
      await expect(nav.getByRole('link', { name: item, exact: true })).toBeVisible()
    }
    await expect(nav.getByRole('link', { name: 'Documentos', exact: true })).toHaveCount(0)
    await expect(nav.getByRole('link', { name: 'Usuarios', exact: true })).toHaveCount(0)
  })

  test('el Administrador ve las secciones de configuración y no la atención de incidencias', async ({ page }) => {
    await loginAs(page, 'admin')
    const nav = page.getByRole('navigation').first()
    for (const item of ['Resumen', 'Incidencias', 'Registro de riesgos', 'Propuestas de riesgo', 'Activos', 'Matriz de evaluación', 'Documentos', 'Configuración IA/RAG', 'Usuarios', 'Roles y permisos', 'Auditoría', 'Mi cuenta']) {
      await expect(nav.getByRole('link', { name: item, exact: true })).toBeVisible()
    }
    await expect(nav.getByRole('link', { name: 'Atención de incidencias', exact: true })).toHaveCount(0)
  })

  test('la primera tecla Tab muestra «Saltar al contenido» y lleva al contenido principal', async ({ page }) => {
    await loginAs(page, 'reporter')
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: USERS.reporter.firstName })).toBeVisible()
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Saltar al contenido' })
    await expect(skip).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#main-content$/)
  })

  test('«Mi cuenta» muestra los datos, el rol y los permisos del usuario', async ({ page }) => {
    await loginAs(page, 'analyst')
    await goTo(page, 'Mi cuenta')
    const main = page.getByRole('main')
    await expect(main).toContainText(USERS.analyst.email)
    await expect(main).toContainText('Analista')
    await expect(main.getByRole('region', { name: 'Perfil y permisos' })).toBeVisible()
  })
})
