import { baseApi } from './baseApi'
import type { LoginRequestDto, LoginResponseDto, UsuarioSesionDto } from '@/types/api.types'

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResponseDto, LoginRequestDto>({
      query: (body) => ({ url: 'auth/login/', method: 'POST', body }),
    }),
    getMe: build.query<UsuarioSesionDto, void>({
      query: () => 'auth/me/',
      providesTags: ['User'],
    }),
  }),
})

export const { useLoginMutation, useGetMeQuery } = authApi
