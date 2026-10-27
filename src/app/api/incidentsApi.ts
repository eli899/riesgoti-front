import { API_ENDPOINTS, API_TAGS, HTTP_METHODS } from '@/constants/api.constants'
import { saveBlob } from '@/lib/download'
import { baseApi } from './baseApi'
import type {
  HumanAttentionRequestDto,
  IncidentDetailDto,
  IncidentDto,
  IncidentListParamsDto,
  OperationalGuidanceDto,
  OrientationFeedbackRequestDto,
  RetryStrategicDto,
} from '@/types/api.types'

export const incidentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getIncidents: build.query<IncidentDto[], IncidentListParamsDto | void>({
      query: (params) => ({ url: API_ENDPOINTS.INCIDENTS, params: params ?? undefined }),
      providesTags: [API_TAGS.INCIDENT],
    }),
    getIncident: build.query<IncidentDetailDto, number>({
      query: (id) => API_ENDPOINTS.INCIDENT(id),
      providesTags: (_result, _error, id) => [API_TAGS.INCIDENT, { type: API_TAGS.INCIDENT, id }],
    }),
    /** Cuerpo multipart (titulo, descripcion, activo_*, evidencias[]) armado por fromDomainIncidentToApi. */
    createIncident: build.mutation<IncidentDetailDto, FormData>({
      query: (body) => ({ url: API_ENDPOINTS.INCIDENTS, method: HTTP_METHODS.POST, body }),
      invalidatesTags: [API_TAGS.INCIDENT],
    }),
    getOperationalGuidance: build.query<OperationalGuidanceDto, number>({
      query: (id) => API_ENDPOINTS.INCIDENT_OPERATIONAL_GUIDANCE(id),
      providesTags: (_result, _error, id) => [{ type: API_TAGS.OPERATIONAL_GUIDANCE, id }],
    }),
    submitOrientationFeedback: build.mutation<IncidentDetailDto, { id: number; body: OrientationFeedbackRequestDto }>({
      query: ({ id, body }) => ({ url: API_ENDPOINTS.INCIDENT_ORIENTATION_FEEDBACK(id), method: HTTP_METHODS.POST, body }),
      invalidatesTags: (_result, _error, { id }) => [API_TAGS.INCIDENT, { type: API_TAGS.OPERATIONAL_GUIDANCE, id }],
    }),
    startHumanAttention: build.mutation<IncidentDetailDto, number>({
      query: (id) => ({ url: API_ENDPOINTS.INCIDENT_START_ATTENTION(id), method: HTTP_METHODS.POST }),
      invalidatesTags: [API_TAGS.INCIDENT],
    }),
    updateHumanAttention: build.mutation<IncidentDetailDto, { id: number; body: HumanAttentionRequestDto }>({
      query: ({ id, body }) => ({ url: API_ENDPOINTS.INCIDENT_ATTENTION(id), method: HTTP_METHODS.PATCH, body }),
      invalidatesTags: [API_TAGS.INCIDENT],
    }),
    /**
     * Descarga autenticada (Bearer) de una EVIDENCIA_INCIDENCIA. El archivo se entrega al navegador en el
     * responseHandler; en la caché solo queda un resultado serializable.
     */
    downloadEvidence: build.mutation<{ fileName: string; bytes: number }, { incidentId: number; evidenceId: number; fileName: string }>({
      query: ({ incidentId, evidenceId, fileName }) => ({
        url: API_ENDPOINTS.INCIDENT_EVIDENCE_DOWNLOAD(incidentId, evidenceId),
        responseHandler: async (response) => {
          if (!response.ok) return response.json().catch(() => ({ detail: 'No se pudo descargar la evidencia.' }))
          const blob = await response.blob()
          saveBlob(blob, fileName)
          return { fileName, bytes: blob.size }
        },
      }),
    }),
    retryStrategicAnalysis: build.mutation<RetryStrategicDto, number>({
      query: (id) => ({ url: API_ENDPOINTS.INCIDENT_RETRY_STRATEGIC(id), method: HTTP_METHODS.POST }),
      invalidatesTags: [API_TAGS.INCIDENT, API_TAGS.RISK_VERSION],
    }),
  }),
})

export const {
  useGetIncidentsQuery,
  useGetIncidentQuery,
  useCreateIncidentMutation,
  useGetOperationalGuidanceQuery,
  useSubmitOrientationFeedbackMutation,
  useStartHumanAttentionMutation,
  useUpdateHumanAttentionMutation,
  useRetryStrategicAnalysisMutation,
  useDownloadEvidenceMutation,
} = incidentsApi
