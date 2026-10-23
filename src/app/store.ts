import { combineSlices, configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { baseApi } from '@/app/api/baseApi'
import authSlice, { logout, persistAuthState } from '@/features/auth/authSlice'
import uiSlice from '@/features/ui/uiSlice'

const rootReducer = combineSlices(baseApi, authSlice, uiSlice)

/** Al cerrar sesión (manual o por refresh fallido) se descarta la caché de red del usuario anterior. */
const sessionListener = createListenerMiddleware()
sessionListener.startListening({
  actionCreator: logout,
  effect: (_action, api) => {
    api.dispatch(baseApi.util.resetApiState())
  },
})

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(sessionListener.middleware).concat(baseApi.middleware),
})

let persistedAuth = store.getState().auth
store.subscribe(() => {
  const { auth } = store.getState()
  if (auth === persistedAuth) return
  persistedAuth = auth
  persistAuthState(auth)
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch
