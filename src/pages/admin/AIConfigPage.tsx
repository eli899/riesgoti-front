import AsyncContent from '@/components/AsyncContent'
import AIConfigFormView from '@/components/admin/AIConfigFormView'
import AIConnectionPingCard from '@/components/admin/AIConnectionPingCard'
import VectorOutdatedAlert from '@/components/admin/VectorOutdatedAlert'
import PageMeta from '@/components/seo/PageMeta'
import { Activity } from 'lucide-react'
import { Card, CardHeader, ErrorState, PageHeader } from '@/components/ui'
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
          {(ai.config || ai.isMissing) && ai.formDefaults && (
            <>
              {ai.isMissing && (
                <p role="status" className="mb-5 rounded-card border border-mid bg-soft p-4 text-sm text-primary-pressed">
                  Aún no hay una configuración IA/RAG publicada. Mientras no exista, las incidencias nuevas pasan directamente a atención humana y no se pueden procesar documentos. Revisa los valores sugeridos, agrega las API keys que necesites y publícala.
                </p>
              )}
              {ai.config?.requiresReindex && (
                <section className="mb-5">
                  <VectorOutdatedAlert embeddingModel={ai.config.embeddingModel} versions={ai.config.outdatedVersions} />
                </section>
              )}
              <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
                <AIConfigFormView
                  key={ai.config?.version ?? 'initial'}
                  defaultValues={ai.formDefaults}
                  llmKeyMask={ai.config?.llmApiKeyMask ?? null}
                  embeddingKeyMask={ai.config?.embeddingApiKeyMask ?? null}
                  isInitial={ai.isMissing}
                  isSaving={ai.isSaving}
                  isTesting={ai.isTesting}
                  onSubmit={ai.save}
                  onTestConnection={ai.runConnectionTest}
                />
                <aside aria-label="Panel de diagnóstico" className="xl:sticky xl:top-20">
                  <Card aria-labelledby="ping-title">
                    <CardHeader title="Diagnóstico de conectividad" titleId="ping-title" icon={<Activity size={18} />} sub="Latencia y validez de credenciales con los valores del formulario." />
                    <section aria-live="polite" className="space-y-3 p-4 md:p-5">
                      {ai.testError && <ErrorState title="La prueba no pudo ejecutarse" text={ai.testError} />}
                      {ai.testResult ? (
                        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-1" aria-label="Resultados de la prueba">
                          <AIConnectionPingCard title="Modelo de lenguaje" check={ai.testResult.llm} />
                          <AIConnectionPingCard title="Embeddings" check={ai.testResult.embedding} dimensions={ai.testResult.embedding.dimensions} />
                        </section>
                      ) : (
                        !ai.testError && <p className="text-sm text-muted">{ai.isTesting ? 'Consultando a los proveedores…' : 'Pulsa «Probar conexión» para medir latencia y validar las credenciales con los valores del formulario.'}</p>
                      )}
                    </section>
                  </Card>
                </aside>
              </section>
            </>
          )}
        </AsyncContent>
      </main>
    </>
  )
}
