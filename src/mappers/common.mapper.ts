import type { CitationDto } from '@/types/api.types'
import type { AssetCriticality, Citation, UserRef } from '@/types/domain.types'
import { RISK_LEVEL } from '@/constants/domain.constants'

const CRITICALITY_BY_VALUE: Record<number, AssetCriticality> = {
  1: RISK_LEVEL.BAJO,
  2: RISK_LEVEL.MEDIO,
  3: RISK_LEVEL.ALTO,
  4: RISK_LEVEL.CRITICO,
}

/** ACTIVO.criticidad (INT 1..4) -> escala de NIVEL_RIESGO. */
export function fromApiCriticalityToDomain(value: number | null): AssetCriticality | null {
  return value === null ? null : CRITICALITY_BY_VALUE[value] ?? null
}

export function toUserRef(id: number | null, name: string | null): UserRef {
  return { id, name: name ?? 'Usuario no disponible' }
}

/** CITA_ORIENTACION / CITA_VERSION_RIESGO -> Citation (inmutable aunque la versión documental se desactive, INV-04). */
export function fromApiCitationToDomain(dto: CitationDto): Citation {
  return {
    number: dto.numero,
    fragmentId: dto.fragmento_id,
    documentCode: dto.documento_codigo,
    documentTitle: dto.documento_titulo,
    documentVersion: dto.version,
    documentActive: dto.documento_activo ?? null,
    pageStart: dto.pagina_inicio,
    pageEnd: dto.pagina_fin,
    content: dto.contenido,
  }
}

/** Texto opcional del formulario -> valor del DTO (vacío o solo espacios se omite). */
export function optionalText(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}
