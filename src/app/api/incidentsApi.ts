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
      query: (params) => ({ url: 'incidents/', params: params ?? undefined }),
      providesTags: ['Incident'],
    }),
    getIncident: build.query<IncidentDetailDto, number>({
      query: (id) => `incidents/${id}/`,
      providesTags: (_result, _error, id) => ['Incident', { type: 'Incident', id }],
    }),
    /** Cuerpo multipart (titulo, descripcion, activo_*, evidencias[]) armado por fromDomainIncidentToApi. */
    createIncident: build.mutation<IncidentDetailDto, FormData>({
      query: (body) => ({ url: 'incidents/', method: 'POST', body }),
      invalidatesTags: ['Incident'],
    }),
    getOperationalGuidance: build.query<OperationalGuidanceDto, number>({
      query: (id) => `incidents/${id}/operational-guidance/`,
      providesTags: (_result, _error, id) => [{ type: 'OperationalGuidance', id }],
    }),
    submitOrientationFeedback: build.mutation<IncidentDetailDto, { id: number; body: OrientationFeedbackRequestDto }>({
      query: ({ id, body }) => ({ url: `incidents/${id}/orientation-feedback/`, method: 'POST', body }),
      invalidatesTags: (_result, _error, { id }) => ['Incident', { type: 'OperationalGuidance', id }],
    }),
    startHumanAttention: build.mutation<IncidentDetailDto, number>({
      query: (id) => ({ url: `incidents/${id}/start-attention/`, method: 'POST' }),
      invalidatesTags: ['Incident'],
    }),
    updateHumanAttention: build.mutation<IncidentDetailDto, { id: number; body: HumanAttentionRequestDto }>({
      query: ({ id, body }) => ({ url: `incidents/${id}/attention/`, method: 'PATCH', body }),
      invalidatesTags: ['Incident'],
    }),
    /**
     * Descarga autenticada (Bearer) de una EVIDENCIA_INCIDENCIA. El archivo se entrega al navegador en el
     * responseHandler; en la caché solo queda un resultado serializable.
     */
    downloadEvidence: build.mutation<{ fileName: string; bytes: number }, { incidentId: number; evidenceId: number; fileName: string }>({
      query: ({ incidentId, evidenceId, fileName }) => ({
        url: `incidents/${incidentId}/evidences/${evidenceId}/download/`,
        responseHandler: async (response) => {
          if (!response.ok) return response.json().catch(() => ({ detail: 'No se pudo descargar la evidencia.' }))
          const blob = await response.blob()
          saveBlob(blob, fileName)
          return { fileName, bytes: blob.size }
        },
      }),
    }),
    retryStrategicAnalysis: build.mutation<RetryStrategicDto, number>({
      query: (id) => ({ url: `incidents/${id}/retry-strategic/`, method: 'POST' }),
      invalidatesTags: ['Incident', 'RiskVersion'],
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
