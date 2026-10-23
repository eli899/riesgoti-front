import AsyncContent from '@/components/AsyncContent'
import AIConfigFormView from '@/components/admin/AIConfigFormView'
import AIConnectionPingCard from '@/components/admin/AIConnectionPingCard'
import VectorOutdatedAlert from '@/components/admin/VectorOutdatedAlert'
import PageMeta from '@/components/seo/PageMeta'
import { ErrorState, PageHeader } from '@/components/ui'
import { useAIConfigManager } from '@/hooks/admin/useAIConfigManager'
import { formatDateTime } from '@/lib/format'

/** Sub-vista: configuración IA/RAG (CONFIGURACION_IA_RAG) con prueba de conectividad. */
export default function AIConfigPage() {
  const ai = useAIConfigManager()

  return (
    <>
      <PageMeta title="Configuración IA/RAG — Administración" description="Proveedores LLM y de embeddings, credenciales cifradas y parámetros de recuperación RAG de RiesgoTI." />
      <main id="main-content" className="page-in">
        <PageHeader
          title="Configuración IA/RAG"
          sub={ai.config ? <>Cada cambio crea una versión nueva y auditada. Vigente: <strong>{ai.config.version}</strong>, publicada el {formatDateTime(ai.config.createdAt)}</> : 'Proveedores, credenciales y parámetros de recuperación.'}
        />
        <AsyncContent isLoading={ai.isLoading} error={ai.loadError} onRetry={ai.retryLoad} label="la configuración IA/RAG">
          {ai.config && ai.formDefaults && (
            <>
              {ai.config.requiresReindex && (
                <section className="mb-5">
                  <VectorOutdatedAlert embeddingModel={ai.config.embeddingModel} versions={ai.config.outdatedVersions} />
                </section>
              )}
              <AIConfigFormView
                key={ai.config.version}
                defaultValues={ai.formDefaults}
                llmKeyMask={ai.config.llmApiKeyMask}
                embeddingKeyMask={ai.config.embeddingApiKeyMask}
                isSaving={ai.isSaving}
                isTesting={ai.isTesting}
                onSubmit={ai.save}
                onTestConnection={ai.runConnectionTest}
              />
              <section aria-labelledby="ping-title" aria-live="polite" className="mt-6">
                <h2 id="ping-title" className="mb-3 text-[16px] font-semibold">Diagnóstico de conectividad</h2>
                {ai.testError && <ErrorState title="La prueba no pudo ejecutarse" text={ai.testError} />}
                {ai.testResult ? (
                  <section className="grid gap-3 md:grid-cols-2" aria-label="Resultados de la prueba">
                    <AIConnectionPingCard title="Modelo de lenguaje" check={ai.testResult.llm} />
                    <AIConnectionPingCard title="Embeddings" check={ai.testResult.embedding} dimensions={ai.testResult.embedding.dimensions} />
                  </section>
                ) : (
                  !ai.testError && <p className="text-[13px] text-muted">{ai.isTesting ? 'Consultando a los proveedores…' : 'Pulsa «Probar conexión» para medir latencia y validar las credenciales con los valores del formulario.'}</p>
                )}
              </section>
            </>
          )}
        </AsyncContent>
      </main>
    </>
  )
}
