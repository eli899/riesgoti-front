import type { LoginFormValues } from '@/schemas/auth.schema'
import type { LoginRequestDto, LoginResponseDto, UsuarioSesionDto } from '@/types/api.types'
import type { AuthSession, PermissionCode, SessionUser } from '@/types/domain.types'

export function fromApiSessionUserToDomain(dto: UsuarioSesionDto): SessionUser {
  return {
    id: dto.usuario_id,
    email: dto.correo,
    firstName: dto.nombres,
    lastName: dto.apellidos,
    fullName: dto.nombre_completo,
    roleId: dto.rol_id,
    roleCode: dto.rol_codigo,
    roleName: dto.rol_nombre,
    permissions: dto.permisos as PermissionCode[],
  }
}

export function fromApiLoginToDomainSession(dto: LoginResponseDto): AuthSession {
  return {
    user: fromApiSessionUserToDomain(dto.user),
    accessToken: dto.access,
    refreshToken: dto.refresh,
  }
}

export function fromDomainLoginToApi(values: LoginFormValues): LoginRequestDto {
  return { correo: values.correo.trim().toLowerCase(), password: values.password }
}
