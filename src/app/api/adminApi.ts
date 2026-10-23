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

const documentAction = (action: 'authorize' | 'activate' | 'deactivate' | 'retry' | 'reindex') => (id: number) => ({
  url: `admin/document-versions/${id}/${action}/`,
  method: 'POST' as const,
})

export const adminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Auditoría transversal (permiso usuario.administrar); sin caché: cada consulta refleja la bitácora vigente.
    getAuditEvents: build.query<PaginatedResponseDto<AuditEventDto>, AuditEventListParamsDto>({
      query: (params) => ({ url: 'admin/audit-events/', params }),
      keepUnusedDataFor: 0,
    }),
    // Configuración IA/RAG (permiso documento.administrar)
    getActiveAIConfig: build.query<AIConfigDto, void>({
      query: () => 'admin/ai-config/',
      providesTags: ['AIConfig'],
    }),
    updateAIConfig: build.mutation<AIConfigDto, AIConfigUpdateRequestDto>({
      query: (body) => ({ url: 'admin/ai-config/', method: 'PUT', body }),
      invalidatesTags: ['AIConfig', 'DocumentVersion'],
    }),
    testAIConnection: build.mutation<AIConnectionTestDto, AIConnectionTestRequestDto>({
      query: (body) => ({ url: 'admin/ai-config/test-connection/', method: 'POST', body }),
    }),

    // Base de conocimiento (VERSION_DOCUMENTO)
    getDocumentVersions: build.query<DocumentVersionDto[], void>({
      query: () => 'admin/document-versions/',
      providesTags: ['DocumentVersion'],
    }),
    /** Cuerpo multipart armado por fromDomainDocumentUploadToApi. */
    uploadDocumentVersion: build.mutation<DocumentVersionDto, FormData>({
      query: (body) => ({ url: 'admin/document-versions/upload/', method: 'POST', body }),
      invalidatesTags: ['DocumentVersion'],
    }),
    getDocumentPreview: build.query<DocumentPreviewDto, number>({
      query: (id) => `admin/document-versions/${id}/preview/`,
      providesTags: (_result, _error, id) => [{ type: 'DocumentVersion', id }],
    }),
    authorizeDocumentVersion: build.mutation<DocumentVersionDto, number>({
      query: documentAction('authorize'),
      invalidatesTags: ['DocumentVersion'],
    }),
    activateDocumentVersion: build.mutation<DocumentVersionDto, number>({
      query: documentAction('activate'),
      invalidatesTags: ['DocumentVersion'],
    }),
    deactivateDocumentVersion: build.mutation<DocumentVersionDto, number>({
      query: documentAction('deactivate'),
      invalidatesTags: ['DocumentVersion'],
    }),
    retryDocumentVersion: build.mutation<DocumentVersionDto, number>({
      query: documentAction('retry'),
      invalidatesTags: ['DocumentVersion'],
    }),
    reindexDocumentVersion: build.mutation<DocumentVersionDto, number>({
      query: documentAction('reindex'),
      invalidatesTags: ['DocumentVersion'],
    }),

    // Matriz 5x5 (CONFIGURACION_MATRIZ / CELDA_MATRIZ)
    getActiveMatrix: build.query<MatrixConfigDto, void>({
      query: () => 'matrices/active/',
      providesTags: ['MatrixConfig'],
    }),
    publishMatrix: build.mutation<MatrixConfigDto, MatrixPublishRequestDto>({
      query: (body) => ({ url: 'admin/matrices/publish/', method: 'POST', body }),
      invalidatesTags: ['MatrixConfig'],
    }),

    // Catálogo de activos (lectura: autenticado; escritura: activo.administrar)
    getAssets: build.query<AssetDto[], void>({
      query: () => 'assets/',
      providesTags: ['Asset'],
    }),
    getAssetTypes: build.query<AssetTypeDto[], void>({
      query: () => 'asset-types/',
      providesTags: ['Asset'],
    }),
    createAsset: build.mutation<AssetDto, AssetRequestDto>({
      query: (body) => ({ url: 'assets/', method: 'POST', body }),
      invalidatesTags: ['Asset'],
    }),
    updateAsset: build.mutation<AssetDto, { id: number; body: Partial<AssetRequestDto> }>({
      query: ({ id, body }) => ({ url: `assets/${id}/`, method: 'PATCH', body }),
      invalidatesTags: ['Asset'],
    }),

    // Usuarios (usuario.administrar)
    getUsers: build.query<UserDto[], void>({
      query: () => 'admin/users/',
      providesTags: ['User'],
    }),
    createUser: build.mutation<UserDto, UserRequestDto>({
      query: (body) => ({ url: 'admin/users/', method: 'POST', body }),
      invalidatesTags: ['User', 'Role'],
    }),
    updateUser: build.mutation<UserDto, { id: number; body: UserRequestDto }>({
      query: ({ id, body }) => ({ url: `admin/users/${id}/`, method: 'PATCH', body }),
      invalidatesTags: ['User', 'Role'],
    }),

    // Roles y permisos (rol.administrar)
    getRoles: build.query<RoleDto[], void>({
      query: () => 'admin/roles/',
      providesTags: ['Role'],
    }),
    getPermissions: build.query<PermissionDto[], void>({
      query: () => 'admin/permissions/',
      providesTags: ['Role'],
    }),
    createRole: build.mutation<RoleDto, RoleRequestDto>({
      query: (body) => ({ url: 'admin/roles/', method: 'POST', body }),
      invalidatesTags: ['Role'],
    }),
    updateRole: build.mutation<RoleDto, { id: number; body: RoleRequestDto }>({
      query: ({ id, body }) => ({ url: `admin/roles/${id}/`, method: 'PUT', body }),
      invalidatesTags: ['Role', 'User'],
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
