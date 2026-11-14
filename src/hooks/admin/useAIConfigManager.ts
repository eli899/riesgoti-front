import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useGetActiveAIConfigQuery, useTestAIConnectionMutation, useUpdateAIConfigMutation } from '@/app/api/adminApi'
import { runMutation, toApiFailure, type SubmitResult } from '@/lib/apiErrors'
import {
  fromApiAIConfigToDomain,
  fromApiAIConnectionTestToDomain,
  fromDomainAIConfigToApi,
  fromDomainAIConfigToConnectionTestApi,
  fromDomainAIConfigToFormValues,
  initialAIConfigFormValues,
} from '@/mappers/admin.mapper'
import type { AIConfigFormValues } from '@/schemas/aiConfig.schema'
import type { AIConnectionTestResult } from '@/types/domain.types'
import { HTTP_STATUS } from '@/constants/api.constants'

/** Caso de uso: configuración IA/RAG vigente, publicación de nueva versión y prueba de conectividad. */
export function useAIConfigManager() {
  const { data, isLoading, error, refetch } = useGetActiveAIConfigQuery()
  const [updateConfig, { isLoading: isSaving }] = useUpdateAIConfigMutation()
  const [testConnection, { isLoading: isTesting }] = useTestAIConnectionMutation()
  const [testResult, setTestResult] = useState<AIConnectionTestResult | null>(null)
  const [testError, setTestError] = useState<string | null>(null)

  const config = useMemo(() => (data ? fromApiAIConfigToDomain(data) : null), [data])
  const failure = error ? toApiFailure(error) : null
  // Semilla base (CHG-0039): sin configuración publicada se ofrece el formulario inicial con valores sugeridos.
  const isMissing = failure?.status === HTTP_STATUS.NOT_FOUND
  const formDefaults = useMemo(() => (config ? fromDomainAIConfigToFormValues(config) : isMissing ? initialAIConfigFormValues() : null), [config, isMissing])

  const save = useCallback(
    async (values: AIConfigFormValues): Promise<SubmitResult> => {
      const { data: saved, failure } = await runMutation(() => updateConfig(fromDomainAIConfigToApi(values)).unwrap())
      if (failure) return failure
      toast.success(`Configuración ${saved!.version_configuracion} publicada`, {
        description: saved!.requiere_reindexacion_documentos
          ? 'Hay documentos indexados con otro modelo de embedding: requieren reindexación.'
          : 'Las nuevas consultas RAG usarán estos parámetros.',
      })
      return undefined
    },
    [updateConfig],
  )

  const runConnectionTest = useCallback(
    async (values: AIConfigFormValues) => {
      setTestError(null)
      setTestResult(null)
      const { data: result, failure } = await runMutation(() => testConnection(fromDomainAIConfigToConnectionTestApi(values)).unwrap())
      if (failure) setTestError(failure.message)
      else setTestResult(fromApiAIConnectionTestToDomain(result!))
    },
    [testConnection],
  )

  return {
    config,
    formDefaults,
    isLoading,
    isMissing,
    loadError: failure && !isMissing ? failure.message : null,
    retryLoad: refetch,
    save,
    isSaving,
    runConnectionTest,
    isTesting,
    testResult,
    testError,
  }
}
