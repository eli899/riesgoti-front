import { test as setup } from '@playwright/test'
import { loginAs } from './support/ui'
import { USERS, storageStateOf, type UserKey } from './support/users'

// Un inicio de sesión real por usuario semilla; el resto de la suite reutiliza la sesión guardada.
for (const user of Object.keys(USERS) as UserKey[]) {
  setup(`sesión de ${USERS[user].fullName} (${USERS[user].role})`, async ({ page }) => {
    await loginAs(page, user)
    await page.context().storageState({ path: storageStateOf(user) })
  })
}
