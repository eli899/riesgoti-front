import { z } from 'zod'

/** Contrato de CONFIGURACION_IA_RAG (espejo de AIConfigInputSerializer). */
export const aiConfigFormSchema = z
  .object({
    proveedor_llm: z.enum(['OPENAI', 'GEMINI', 'HUGGINGFACE_LOCAL']),
    modelo_llm: z.string().min(2, 'Seleccione o ingrese un modelo LLM válido'),
    endpoint_base_llm: z.string().url('URL inválida').optional().or(z.literal('')),
    api_key_llm: z.string().optional(),
    proveedor_embedding: z.enum(['OPENAI', 'GEMINI', 'SENTENCE_TRANSFORMERS']),
    modelo_embedding: z.string().min(2, 'El modelo de embedding es obligatorio'),
    api_key_embedding: z.string().optional(),
    chunk_size: z.number({ invalid_type_error: 'Ingrese el tamaño del fragmento' }).int().min(256, 'Mínimo 256 tokens').max(2048, 'Máximo 2048 tokens'),
    chunk_overlap: z.number({ invalid_type_error: 'Ingrese el solapamiento' }).int().min(0, 'Mínimo 0 tokens').max(512, 'Máximo 512 tokens'),
    top_k: z.number({ invalid_type_error: 'Ingrese la cantidad de fragmentos' }).int().min(1, 'Mínimo 1 fragmento').max(15, 'Máximo 15 fragmentos'),
    umbral_similitud: z.number({ invalid_type_error: 'Ingrese el umbral de similitud' }).min(0, 'Mínimo 0.00').max(1, 'Máximo 1.00'),
  })
  .refine((data) => data.chunk_overlap < data.chunk_size / 2, {
    message: 'El solapamiento (chunk_overlap) debe ser estrictamente menor a la mitad del chunk_size',
    path: ['chunk_overlap'],
  })

export type AIConfigFormValues = z.infer<typeof aiConfigFormSchema>
