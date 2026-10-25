import { expect, type Locator, type Page } from '@playwright/test'
import { ROUTES } from './routes'
import { SEED_PASSWORD, USERS, type UserKey } from './users'

/** Inicia sesión como lo haría una persona: escribe correo y contraseña y pulsa «Ingresar». */
export async function loginAs(page: Page, user: UserKey, password = SEED_PASSWORD) {
  await page.goto(ROUTES.LOGIN)
  await submitLogin(page, user, password)
}

/** Completa el formulario de login ya visible (p. ej. tras la redirección de un enlace directo sin sesión). */
export async function submitLogin(page: Page, user: UserKey, password = SEED_PASSWORD) {
  await page.getByLabel('Correo institucional').fill(USERS[user].email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
  await expect(page.getByRole('banner')).toContainText(USERS[user].fullName)
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Salir' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeVisible()
}

/** Navega con el menú lateral (enlace visible por su texto) y espera el <h1> de la sección. */
export async function goTo(page: Page, menuItem: string, heading?: string | RegExp) {
  await page.getByRole('navigation').first().getByRole('link', { name: menuItem, exact: true }).click()
  await expect(page.getByRole('link', { name: menuItem, exact: true }).first()).toHaveAttribute('aria-current', 'page')
  if (heading) await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
}

export const dialog = (page: Page, name: string | RegExp) => page.getByRole('dialog', { name })

export const mainContent = (page: Page): Locator => page.getByRole('main')

/** Sufijo único por ejecución para que los datos creados por la suite no colisionen entre pruebas. */
export const uniqueSuffix = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`.toUpperCase()
