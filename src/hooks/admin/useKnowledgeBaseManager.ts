import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  useActivateDocumentVersionMutation,
  useAuthorizeDocumentVersionMutation,
  useDeactivateDocumentVersionMutation,
  useGetDocumentPreviewQuery,
  useGetDocumentVersionsQuery,
  useReindexDocumentVersionMutation,
  useRetryDocumentVersionMutation,
  useUploadDocumentVersionMutation,
} from '@/app/api/adminApi'
import { runMutation, toApiFailure, type SubmitResult } from '@/lib/apiErrors'
import {
  fromApiDocumentPreviewToDomain,
  fromApiDocumentVersionToDomain,
  fromDomainDocumentUploadToApi,
} from '@/mappers/admin.mapper'
import type { DocumentUploadFormValues } from '@/schemas/document.schema'

export const DOCUMENT_POLLING_MS = 3000

export type DocumentAction = 'authorize' | 'activate' | 'deactivate' | 'retry' | 'reindex'

const ACTION_MESSAGES: Record<DocumentAction, string> = {
  authorize: 'Versión autorizada y activada para consultas RAG',
  activate: 'Versión activada: vuelve a participar en nuevas consultas',
  deactivate: 'Versión desactivada: las citas históricas se conservan',
  retry: 'Reprocesamiento iniciado',
  reindex: 'Reindexación iniciada con el modelo de embedding vigente',
}

/** Caso de uso: ciclo de vida de VERSION_DOCUMENTO con polling automático mientras haya PDFs en PROCESANDO. */
export function useKnowledgeBaseManager() {
  const { data, isLoading, error, refetch } = useGetDocumentVersionsQuery()
  const versions = useMemo(() => (data ?? []).map(fromApiDocumentVersionToDomain), [data])
  const hasProcessing = versions.some((v) => v.processing === 'PROCESANDO')

  // Segunda suscripción a la misma caché: solo existe (y sondea cada 3 s) mientras haya documentos en proceso.
  useGetDocumentVersionsQuery(undefined, { skip: !hasProcessing, pollingInterval: hasProcessing ? DOCUMENT_POLLING_MS : 0 })

  const [upload, { isLoading: isUploading }] = useUploadDocumentVersionMutation()
  const [authorize] = useAuthorizeDocumentVersionMutation()
  const [activate] = useActivateDocumentVersionMutation()
  const [deactivate] = useDeactivateDocumentVersionMutation()
  const [retry] = useRetryDocumentVersionMutation()
  const [reindex] = useReindexDocumentVersionMutation()
  const [pendingAction, setPendingAction] = useState<{ id: number; action: DocumentAction } | null>(null)

  const uploadVersion = useCallback(
    async (values: DocumentUploadFormValues): Promise<SubmitResult> => {
      const { failure } = await runMutation(() => upload(fromDomainDocumentUploadToApi(values)).unwrap(), 'No se pudo cargar el PDF.')
      if (failure) return failure
      toast.success('PDF recibido', { description: 'Se está convirtiendo a Markdown y segmentando en fragmentos.' })
      return undefined
    },
    [upload],
  )

  const runAction = useCallback(
    async (id: number, action: DocumentAction): Promise<boolean> => {
      const mutation = { authorize, activate, deactivate, retry, reindex }[action]
      setPendingAction({ id, action })
      const { failure } = await runMutation(() => mutation(id).unwrap())
      setPendingAction(null)
      if (failure) {
        toast.error('No se pudo completar la acción', { description: failure.message })
        return false
      }
      toast.success(ACTION_MESSAGES[action])
      return true
    },
    [authorize, activate, deactivate, retry, reindex],
  )

  return {
    versions,
    isLoading,
    loadError: error ? toApiFailure(error).message : null,
    retryLoad: refetch,
    isPolling: hasProcessing,
    uploadVersion,
    isUploading,
    runAction,
    pendingAction,
  }
}

/** Caso de uso: previsualización de los fragmentos Markdown de una versión documental. */
export function useDocumentPreview(versionId: number | null) {
  const { data, isFetching, error } = useGetDocumentPreviewQuery(versionId ?? 0, { skip: versionId === null })
  const preview = useMemo(() => (data && versionId !== null ? fromApiDocumentPreviewToDomain(data) : null), [data, versionId])
  return { preview, isLoading: isFetching, error: error ? toApiFailure(error).message : null }
}
