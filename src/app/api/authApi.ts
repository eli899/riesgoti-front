import { API_ENDPOINTS, API_TAGS, HTTP_METHODS } from '@/constants/api.constants'
import { baseApi } from './baseApi'
import type { LoginRequestDto, LoginResponseDto, UsuarioSesionDto } from '@/types/api.types'

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResponseDto, LoginRequestDto>({
      query: (body) => ({ url: API_ENDPOINTS.AUTH_LOGIN, method: HTTP_METHODS.POST, body }),
    }),
    getMe: build.query<UsuarioSesionDto, void>({
      query: () => API_ENDPOINTS.AUTH_ME,
      providesTags: [API_TAGS.USER],
    }),
  }),
})

export const { useLoginMutation, useGetMeQuery } = authApi
