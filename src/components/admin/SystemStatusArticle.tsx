import { AlertTriangle, Bot, FileText } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui'
import type { AIConfig } from '@/types/domain.types'

export interface KnowledgeBaseSummary {
  total: number
  available: number
  pendingAuthorization: number
  processing: number
  failed: number
  requiresReindex: number
}

interface SystemStatusArticleProps {
  aiConfig: AIConfig | null
  knowledgeBase: KnowledgeBaseSummary
  onOpenDocuments: () => void
}

/** Estado operativo de la IA y de la base de conocimiento documental. */
export default function SystemStatusArticle({ aiConfig, knowledgeBase, onOpenDocuments }: SystemStatusArticleProps) {
  const attention = knowledgeBase.pendingAuthorization + knowledgeBase.failed + knowledgeBase.requiresReindex
  return (
    <Card as="article" aria-labelledby="system-status-title" className="overflow-hidden">
      <CardHeader titleId="system-status-title" title="Estado del sistema" icon={<Bot size={18} />} sub="IA/RAG y base de conocimiento" />
      <dl className="divide-y divide-line px-4 text-sm md:px-5">
        <div className="flex items-center justify-between gap-3 py-3">
          <dt className="text-muted">Configuración IA vigente</dt>
          <dd className="text-right font-medium">{aiConfig ? `${aiConfig.version} · ${aiConfig.llmModel}` : '—'}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <dt className="text-muted">Umbral de similitud · top-k</dt>
          <dd className="font-medium">{aiConfig ? `${aiConfig.similarityThreshold.toFixed(2)} · ${aiConfig.topK}` : '—'}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <dt className="flex items-center gap-1.5 text-muted"><FileText size={14} aria-hidden />Documentos disponibles en RAG</dt>
          <dd className="font-medium">{knowledgeBase.available} de {knowledgeBase.total}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <dt className="text-muted">En procesamiento</dt>
          <dd className="font-medium">{knowledgeBase.processing}</dd>
        </div>
      </dl>
      {attention > 0 && (
        <footer className="flex items-start gap-2 border-t border-line bg-soft px-4 py-3 text-xs md:px-5">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-deep" aria-hidden />
          <p className="flex-1 text-muted">
            {knowledgeBase.pendingAuthorization} por autorizar · {knowledgeBase.failed} con error · {knowledgeBase.requiresReindex} por reindexar.{' '}
            <button type="button" onClick={onOpenDocuments} className="font-semibold text-primary underline-offset-2 hover:underline">Revisar documentos</button>
          </p>
        </footer>
      )}
    </Card>
  )
}
