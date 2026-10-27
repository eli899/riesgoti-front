import { API_ENDPOINTS, API_TAGS, HTTP_METHODS } from '@/constants/api.constants'
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
      query: (params) => ({ url: API_ENDPOINTS.RISK_VERSIONS, params: params ?? undefined }),
      providesTags: [API_TAGS.RISK_VERSION],
    }),
    getRiskVersion: build.query<RiskVersionDto, number>({
      query: (id) => API_ENDPOINTS.RISK_VERSION(id),
      providesTags: (_result, _error, id) => [API_TAGS.RISK_VERSION, { type: API_TAGS.RISK_VERSION, id }],
    }),
    removeIncidentFromRiskGroup: build.mutation<RiskVersionDto, { id: number; analisisId: number; body: RemoveIncidentRequestDto }>({
      query: ({ id, analisisId, body }) => ({ url: API_ENDPOINTS.RISK_VERSION_REMOVE_INCIDENT(id, analisisId), method: HTTP_METHODS.PATCH, body }),
      invalidatesTags: [API_TAGS.RISK_VERSION],
    }),
    restoreIncidentToRiskGroup: build.mutation<RiskVersionDto, { id: number; analisisId: number; observacion?: string }>({
      query: ({ id, analisisId, observacion }) => ({
        url: API_ENDPOINTS.RISK_VERSION_RESTORE_INCIDENT(id, analisisId),
        method: HTTP_METHODS.PATCH,
        body: { observacion },
      }),
      invalidatesTags: [API_TAGS.RISK_VERSION],
    }),
    confirmRiskGrouping: build.mutation<RiskVersionDto, { id: number; body: ConfirmGroupingRequestDto }>({
      query: ({ id, body }) => ({ url: API_ENDPOINTS.RISK_VERSION_CONFIRM_GROUPING(id), method: HTTP_METHODS.POST, body }),
      invalidatesTags: [API_TAGS.RISK_VERSION],
    }),
    evaluateRiskVersion: build.mutation<RiskEvaluationDto, { id: number; body: RiskEvaluateRequestDto }>({
      query: ({ id, body }) => ({ url: API_ENDPOINTS.RISK_VERSION_EVALUATE(id), method: HTTP_METHODS.POST, body }),
      invalidatesTags: [API_TAGS.RISK_VERSION],
    }),
    /** CORREGIDA responde 201 con la nueva versión n+1 del analista. */
    submitRiskDecision: build.mutation<RiskVersionDto, { id: number; body: RiskDecisionRequestDto }>({
      query: ({ id, body }) => ({ url: API_ENDPOINTS.RISK_VERSION_DECISION(id), method: HTTP_METHODS.POST, body }),
      invalidatesTags: [API_TAGS.RISK_VERSION, API_TAGS.RISK_DASHBOARD],
    }),
    getRiskDashboard: build.query<RiskDashboardDto, void>({
      query: () => API_ENDPOINTS.RISK_DASHBOARD,
      providesTags: [API_TAGS.RISK_DASHBOARD],
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
