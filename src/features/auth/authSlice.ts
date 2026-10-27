import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthSession, PermissionCode, RoleCode, SessionUser } from '@/types/domain.types'
import { PERMISSIONS, ROLES } from '@/constants/rbac.constants'

export const AUTH_STORAGE_KEY = 'riesgoti_auth'

export interface AuthState {
  user: SessionUser | null
  accessToken: string | null
  refreshToken: string | null
}

const EMPTY_PERMISSIONS: PermissionCode[] = []
const emptyState: AuthState = { user: null, accessToken: null, refreshToken: null }

function loadPersistedState(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return emptyState
    const parsed = JSON.parse(raw) as Partial<AuthState>
    if (!parsed.user || !parsed.accessToken || !parsed.refreshToken) return emptyState
    return { user: parsed.user, accessToken: parsed.accessToken, refreshToken: parsed.refreshToken }
  } catch {
    return emptyState
  }
}

export function persistAuthState(state: AuthState) {
  try {
    if (state.accessToken) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state))
    else localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // Almacenamiento no disponible (modo privado): la sesión vive solo en memoria.
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState: loadPersistedState,
  reducers: {
    setCredentials: (_state, action: PayloadAction<AuthSession>) => ({
      user: action.payload.user,
      accessToken: action.payload.accessToken,
      refreshToken: action.payload.refreshToken,
    }),
    tokenRefreshed: (state, action: PayloadAction<{ accessToken: string; refreshToken?: string }>) => {
      state.accessToken = action.payload.accessToken
      if (action.payload.refreshToken) state.refreshToken = action.payload.refreshToken
    },
    profileLoaded: (state, action: PayloadAction<SessionUser>) => {
      state.user = action.payload
    },
    logout: () => emptyState,
  },
  selectors: {
    selectCurrentUser: (state) => state.user,
    selectAccessToken: (state) => state.accessToken,
    selectRefreshToken: (state) => state.refreshToken,
    selectIsAuthenticated: (state) => state.user !== null && state.accessToken !== null,
    selectCurrentRole: (state): RoleCode | null => state.user?.roleCode ?? null,
    selectUserPermissions: (state): PermissionCode[] => state.user?.permissions ?? EMPTY_PERMISSIONS,
    /** SoD ISO/IEC 27001: un ADMIN jamás evalúa ni valida riesgos, aunque tenga el permiso asignado. */
    selectCanEvaluateRisks: (state) =>
      state.user !== null && state.user.roleCode !== ROLES.ADMIN && state.user.permissions.includes(PERMISSIONS.RISK_EVALUATE),
  },
})

export const { setCredentials, tokenRefreshed, profileLoaded, logout } = authSlice.actions
export const {
  selectCurrentUser,
  selectAccessToken,
  selectRefreshToken,
  selectIsAuthenticated,
  selectCurrentRole,
  selectUserPermissions,
  selectCanEvaluateRisks,
} = authSlice.selectors
export default authSlice
