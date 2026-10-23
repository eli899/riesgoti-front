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
} from '@/mappers/admin.mapper'
import type { AIConfigFormValues } from '@/schemas/aiConfig.schema'
import type { AIConnectionTestResult } from '@/types/domain.types'

/** Caso de uso: configuración IA/RAG vigente, publicación de nueva versión y prueba de conectividad. */
export function useAIConfigManager() {
  const { data, isLoading, error, refetch } = useGetActiveAIConfigQuery()
  const [updateConfig, { isLoading: isSaving }] = useUpdateAIConfigMutation()
  const [testConnection, { isLoading: isTesting }] = useTestAIConnectionMutation()
  const [testResult, setTestResult] = useState<AIConnectionTestResult | null>(null)
  const [testError, setTestError] = useState<string | null>(null)

  const config = useMemo(() => (data ? fromApiAIConfigToDomain(data) : null), [data])
  const formDefaults = useMemo(() => (config ? fromDomainAIConfigToFormValues(config) : null), [config])

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
    loadError: error ? toApiFailure(error).message : null,
    retryLoad: refetch,
    save,
    isSaving,
    runConnectionTest,
    isTesting,
    testResult,
    testError,
  }
}
