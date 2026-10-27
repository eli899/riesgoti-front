import { API_ENDPOINTS, API_TAGS, DOCUMENT_ACTIONS, HTTP_METHODS, type DocumentAction } from '@/constants/api.constants'
import { baseApi } from './baseApi'
import type {
  AIConfigDto,
  AIConfigUpdateRequestDto,
  AIConnectionTestDto,
  AIConnectionTestRequestDto,
  AssetDto,
  AssetRequestDto,
  AssetTypeDto,
  AuditEventDto,
  AuditEventListParamsDto,
  DocumentPreviewDto,
  DocumentVersionDto,
  MatrixConfigDto,
  MatrixPublishRequestDto,
  PaginatedResponseDto,
  PermissionDto,
  RoleDto,
  RoleRequestDto,
  UserDto,
  UserRequestDto,
} from '@/types/api.types'

const documentAction = (action: DocumentAction) => (id: number) => ({
  url: API_ENDPOINTS.DOCUMENT_VERSION_ACTION(id, action),
  method: HTTP_METHODS.POST,
})

export const adminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Auditoría transversal (permiso usuario.administrar); sin caché: cada consulta refleja la bitácora vigente.
    getAuditEvents: build.query<PaginatedResponseDto<AuditEventDto>, AuditEventListParamsDto>({
      query: (params) => ({ url: API_ENDPOINTS.AUDIT_EVENTS, params }),
      keepUnusedDataFor: 0,
    }),
    // Configuración IA/RAG (permiso documento.administrar)
    getActiveAIConfig: build.query<AIConfigDto, void>({
      query: () => API_ENDPOINTS.AI_CONFIG,
      providesTags: [API_TAGS.AI_CONFIG],
    }),
    updateAIConfig: build.mutation<AIConfigDto, AIConfigUpdateRequestDto>({
      query: (body) => ({ url: API_ENDPOINTS.AI_CONFIG, method: HTTP_METHODS.PUT, body }),
      invalidatesTags: [API_TAGS.AI_CONFIG, API_TAGS.DOCUMENT_VERSION],
    }),
    testAIConnection: build.mutation<AIConnectionTestDto, AIConnectionTestRequestDto>({
      query: (body) => ({ url: API_ENDPOINTS.AI_CONFIG_TEST_CONNECTION, method: HTTP_METHODS.POST, body }),
    }),

    // Base de conocimiento (VERSION_DOCUMENTO)
    getDocumentVersions: build.query<DocumentVersionDto[], void>({
      query: () => API_ENDPOINTS.DOCUMENT_VERSIONS,
      providesTags: [API_TAGS.DOCUMENT_VERSION],
    }),
    /** Cuerpo multipart armado por fromDomainDocumentUploadToApi. */
    uploadDocumentVersion: build.mutation<DocumentVersionDto, FormData>({
      query: (body) => ({ url: API_ENDPOINTS.DOCUMENT_VERSION_UPLOAD, method: HTTP_METHODS.POST, body }),
      invalidatesTags: [API_TAGS.DOCUMENT_VERSION],
    }),
    getDocumentPreview: build.query<DocumentPreviewDto, number>({
      query: (id) => API_ENDPOINTS.DOCUMENT_VERSION_PREVIEW(id),
      providesTags: (_result, _error, id) => [{ type: API_TAGS.DOCUMENT_VERSION, id }],
    }),
    authorizeDocumentVersion: build.mutation<DocumentVersionDto, number>({
      query: documentAction(DOCUMENT_ACTIONS.AUTHORIZE),
      invalidatesTags: [API_TAGS.DOCUMENT_VERSION],
    }),
    activateDocumentVersion: build.mutation<DocumentVersionDto, number>({
      query: documentAction(DOCUMENT_ACTIONS.ACTIVATE),
      invalidatesTags: [API_TAGS.DOCUMENT_VERSION],
    }),
    deactivateDocumentVersion: build.mutation<DocumentVersionDto, number>({
      query: documentAction(DOCUMENT_ACTIONS.DEACTIVATE),
      invalidatesTags: [API_TAGS.DOCUMENT_VERSION],
    }),
    retryDocumentVersion: build.mutation<DocumentVersionDto, number>({
      query: documentAction(DOCUMENT_ACTIONS.RETRY),
      invalidatesTags: [API_TAGS.DOCUMENT_VERSION],
    }),
    reindexDocumentVersion: build.mutation<DocumentVersionDto, number>({
      query: documentAction(DOCUMENT_ACTIONS.REINDEX),
      invalidatesTags: [API_TAGS.DOCUMENT_VERSION],
    }),

    // Matriz 5x5 (CONFIGURACION_MATRIZ / CELDA_MATRIZ)
    getActiveMatrix: build.query<MatrixConfigDto, void>({
      query: () => API_ENDPOINTS.MATRIX_ACTIVE,
      providesTags: [API_TAGS.MATRIX_CONFIG],
    }),
    publishMatrix: build.mutation<MatrixConfigDto, MatrixPublishRequestDto>({
      query: (body) => ({ url: API_ENDPOINTS.MATRIX_PUBLISH, method: HTTP_METHODS.POST, body }),
      invalidatesTags: [API_TAGS.MATRIX_CONFIG],
    }),

    // Catálogo de activos (lectura: autenticado; escritura: activo.administrar)
    getAssets: build.query<AssetDto[], void>({
      query: () => API_ENDPOINTS.ASSETS,
      providesTags: [API_TAGS.ASSET],
    }),
    getAssetTypes: build.query<AssetTypeDto[], void>({
      query: () => API_ENDPOINTS.ASSET_TYPES,
      providesTags: [API_TAGS.ASSET],
    }),
    createAsset: build.mutation<AssetDto, AssetRequestDto>({
      query: (body) => ({ url: API_ENDPOINTS.ASSETS, method: HTTP_METHODS.POST, body }),
      invalidatesTags: [API_TAGS.ASSET],
    }),
    updateAsset: build.mutation<AssetDto, { id: number; body: Partial<AssetRequestDto> }>({
      query: ({ id, body }) => ({ url: API_ENDPOINTS.ASSET(id), method: HTTP_METHODS.PATCH, body }),
      invalidatesTags: [API_TAGS.ASSET],
    }),

    // Usuarios (usuario.administrar)
    getUsers: build.query<UserDto[], void>({
      query: () => API_ENDPOINTS.USERS,
      providesTags: [API_TAGS.USER],
    }),
    createUser: build.mutation<UserDto, UserRequestDto>({
      query: (body) => ({ url: API_ENDPOINTS.USERS, method: HTTP_METHODS.POST, body }),
      invalidatesTags: [API_TAGS.USER, API_TAGS.ROLE],
    }),
    updateUser: build.mutation<UserDto, { id: number; body: UserRequestDto }>({
      query: ({ id, body }) => ({ url: API_ENDPOINTS.USER(id), method: HTTP_METHODS.PATCH, body }),
      invalidatesTags: [API_TAGS.USER, API_TAGS.ROLE],
    }),

    // Roles y permisos (rol.administrar)
    getRoles: build.query<RoleDto[], void>({
      query: () => API_ENDPOINTS.ROLES,
      providesTags: [API_TAGS.ROLE],
    }),
    getPermissions: build.query<PermissionDto[], void>({
      query: () => API_ENDPOINTS.PERMISSIONS,
      providesTags: [API_TAGS.ROLE],
    }),
    createRole: build.mutation<RoleDto, RoleRequestDto>({
      query: (body) => ({ url: API_ENDPOINTS.ROLES, method: HTTP_METHODS.POST, body }),
      invalidatesTags: [API_TAGS.ROLE],
    }),
    updateRole: build.mutation<RoleDto, { id: number; body: RoleRequestDto }>({
      query: ({ id, body }) => ({ url: API_ENDPOINTS.ROLE(id), method: HTTP_METHODS.PUT, body }),
      invalidatesTags: [API_TAGS.ROLE, API_TAGS.USER],
    }),
  }),
})

export const {
  useGetActiveAIConfigQuery,
  useUpdateAIConfigMutation,
  useTestAIConnectionMutation,
  useGetDocumentVersionsQuery,
  useUploadDocumentVersionMutation,
  useGetDocumentPreviewQuery,
  useAuthorizeDocumentVersionMutation,
  useActivateDocumentVersionMutation,
  useDeactivateDocumentVersionMutation,
  useRetryDocumentVersionMutation,
  useReindexDocumentVersionMutation,
  useGetActiveMatrixQuery,
  usePublishMatrixMutation,
  useGetAssetsQuery,
  useGetAssetTypesQuery,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useGetRolesQuery,
  useGetPermissionsQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useGetAuditEventsQuery,
} = adminApi
