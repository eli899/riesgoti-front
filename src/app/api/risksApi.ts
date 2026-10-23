import { baseApi } from './baseApi'
import type {
  ConfirmGroupingRequestDto,
  RemoveIncidentRequestDto,
  RiskDashboardDto,
  RiskDecisionRequestDto,
  RiskEvaluateRequestDto,
  RiskEvaluationDto,
  RiskVersionDto,
  RiskVersionListParamsDto,
} from '@/types/api.types'

export const risksApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getRiskVersions: build.query<RiskVersionDto[], RiskVersionListParamsDto | void>({
      query: (params) => ({ url: 'risk-versions/', params: params ?? undefined }),
      providesTags: ['RiskVersion'],
    }),
    getRiskVersion: build.query<RiskVersionDto, number>({
      query: (id) => `risk-versions/${id}/`,
      providesTags: (_result, _error, id) => ['RiskVersion', { type: 'RiskVersion', id }],
    }),
    removeIncidentFromRiskGroup: build.mutation<RiskVersionDto, { id: number; analisisId: number; body: RemoveIncidentRequestDto }>({
      query: ({ id, analisisId, body }) => ({ url: `risk-versions/${id}/incidents/${analisisId}/remove/`, method: 'PATCH', body }),
      invalidatesTags: ['RiskVersion'],
    }),
    restoreIncidentToRiskGroup: build.mutation<RiskVersionDto, { id: number; analisisId: number; observacion?: string }>({
      query: ({ id, analisisId, observacion }) => ({
        url: `risk-versions/${id}/incidents/${analisisId}/restore/`,
        method: 'PATCH',
        body: { observacion },
      }),
      invalidatesTags: ['RiskVersion'],
    }),
    confirmRiskGrouping: build.mutation<RiskVersionDto, { id: number; body: ConfirmGroupingRequestDto }>({
      query: ({ id, body }) => ({ url: `risk-versions/${id}/confirm-grouping/`, method: 'POST', body }),
      invalidatesTags: ['RiskVersion'],
    }),
    evaluateRiskVersion: build.mutation<RiskEvaluationDto, { id: number; body: RiskEvaluateRequestDto }>({
      query: ({ id, body }) => ({ url: `risk-versions/${id}/evaluate/`, method: 'POST', body }),
      invalidatesTags: ['RiskVersion'],
    }),
    /** CORREGIDA responde 201 con la nueva versión n+1 del analista. */
    submitRiskDecision: build.mutation<RiskVersionDto, { id: number; body: RiskDecisionRequestDto }>({
      query: ({ id, body }) => ({ url: `risk-versions/${id}/decision/`, method: 'POST', body }),
      invalidatesTags: ['RiskVersion', 'RiskDashboard'],
    }),
    getRiskDashboard: build.query<RiskDashboardDto, void>({
      query: () => 'risks/dashboard/',
      providesTags: ['RiskDashboard'],
    }),
  }),
})

export const {
  useGetRiskVersionsQuery,
  useGetRiskVersionQuery,
  useRemoveIncidentFromRiskGroupMutation,
  useRestoreIncidentToRiskGroupMutation,
  useConfirmRiskGroupingMutation,
  useEvaluateRiskVersionMutation,
  useSubmitRiskDecisionMutation,
  useGetRiskDashboardQuery,
} = risksApi
