import { z } from 'zod'
import { EMBEDDING_PROVIDER, LLM_PROVIDER } from '@/constants/domain.constants'
import { FIELD_LIMITS as L, VALIDATION_MESSAGES } from '@/constants/validation.constants'

const M = VALIDATION_MESSAGES.AI_CONFIG

/** Contrato de CONFIGURACION_IA_RAG (espejo de AIConfigInputSerializer). */
export const aiConfigFormSchema = z
  .object({
    proveedor_llm: z.nativeEnum(LLM_PROVIDER),
    modelo_llm: z.string().min(L.AI_MODEL_MIN, M.LLM_MODEL_REQUIRED),
    endpoint_base_llm: z.string().url(M.URL_INVALID).optional().or(z.literal('')),
    api_key_llm: z.string().optional(),
    proveedor_embedding: z.nativeEnum(EMBEDDING_PROVIDER),
    modelo_embedding: z.string().min(L.AI_MODEL_MIN, M.EMBEDDING_MODEL_REQUIRED),
    api_key_embedding: z.string().optional(),
    chunk_size: z.number({ invalid_type_error: M.CHUNK_SIZE_REQUIRED }).int().min(L.AI_CHUNK_SIZE_MIN, M.CHUNK_SIZE_MIN).max(L.AI_CHUNK_SIZE_MAX, M.CHUNK_SIZE_MAX),
    chunk_overlap: z.number({ invalid_type_error: M.CHUNK_OVERLAP_REQUIRED }).int().min(L.AI_CHUNK_OVERLAP_MIN, M.CHUNK_OVERLAP_MIN).max(L.AI_CHUNK_OVERLAP_MAX, M.CHUNK_OVERLAP_MAX),
    top_k: z.number({ invalid_type_error: M.TOP_K_REQUIRED }).int().min(L.AI_TOP_K_MIN, M.TOP_K_MIN).max(L.AI_TOP_K_MAX, M.TOP_K_MAX),
    umbral_similitud: z.number({ invalid_type_error: M.SIMILARITY_REQUIRED }).min(L.AI_SIMILARITY_MIN, M.SIMILARITY_MIN).max(L.AI_SIMILARITY_MAX, M.SIMILARITY_MAX),
  })
  .refine((data) => data.chunk_overlap < data.chunk_size / 2, {
    message: M.CHUNK_OVERLAP_RATIO,
    path: ['chunk_overlap'],
  })

export type AIConfigFormValues = z.infer<typeof aiConfigFormSchema>
