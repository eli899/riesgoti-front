import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import { API_ENDPOINTS, API_TAGS, AUTH_ENDPOINTS_WITHOUT_REFRESH, HTTP_METHODS } from '@/constants/api.constants'
import { logout, tokenRefreshed, type AuthState } from '@/features/auth/authSlice'
import type { RefreshResponseDto } from '@/types/api.types'

export const API_TAG_TYPES = Object.values(API_TAGS)

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as { auth: AuthState }).auth.accessToken
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  },
})

/** Una única renovación en vuelo: las peticiones concurrentes que reciben 401 esperan el mismo refresh. */
let refreshInFlight: Promise<boolean> | null = null

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  if (refreshInFlight) await refreshInFlight
  let result = await rawBaseQuery(args, api, extraOptions)

  const url = typeof args === 'string' ? args : args.url
  if (result.error?.status !== 401 || AUTH_ENDPOINTS_WITHOUT_REFRESH.some((endpoint) => url.startsWith(endpoint))) return result

  const refreshToken = (api.getState() as { auth: AuthState }).auth.refreshToken
  if (!refreshToken) {
    api.dispatch(logout())
    return result
  }

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshResult = await rawBaseQuery({ url: API_ENDPOINTS.AUTH_REFRESH, method: HTTP_METHODS.POST, body: { refresh: refreshToken } }, api, extraOptions)
      const data = refreshResult.data as RefreshResponseDto | undefined
      if (data?.access) {
        api.dispatch(tokenRefreshed({ accessToken: data.access, refreshToken: data.refresh }))
        return true
      }
      api.dispatch(logout())
      return false
    })().finally(() => {
      refreshInFlight = null
    })
  }

  if (await refreshInFlight) result = await rawBaseQuery(args, api, extraOptions)
  return result
}

/** Servicio API raíz (Capa 1). Los módulos inyectan sus endpoints con `baseApi.injectEndpoints`. */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: API_TAG_TYPES,
  endpoints: () => ({}),
})
