import { useState } from 'react'
import AsyncContent from '@/components/AsyncContent'
import Matrix5x5EditorGrid from '@/components/admin/Matrix5x5EditorGrid'
import MatrixCriteriaList from '@/components/admin/MatrixCriteriaList'
import PublishMatrixDialog from '@/components/admin/PublishMatrixDialog'
import PageMeta from '@/components/seo/PageMeta'
import { Button, Card, PageHeader, SectionTitle, Tabs } from '@/components/ui'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useMatrixConfigManager } from '@/hooks/admin/useMatrixConfigManager'
import { formatDateTime } from '@/lib/format'
import { PERMISSIONS } from '@/constants/rbac.constants'
import { MATRIX_TABS, type MatrixTab } from '@/constants/ui.constants'

/** Sub-vista: matriz de evaluación 5x5 (CONFIGURACION_MATRIZ, CRITERIO_*, CELDA_MATRIZ). */
export default function MatrixPage() {
  const m = useMatrixConfigManager()
  const { hasPermission } = useAuthSession()
  const canEdit = hasPermission(PERMISSIONS.MATRIX_ADMIN)
  const [tab, setTab] = useState<MatrixTab>(MATRIX_TABS.MATRIX)
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <PageMeta title="Matriz de evaluación — Administración" description="Criterios de probabilidad e impacto y niveles de la matriz de riesgo 5x5 (ISO/IEC 27005) de RiesgoTI." />
      <main id="main-content" className="page-in">
        <PageHeader
          title="Matriz de evaluación"
          sub={m.matrix ? <>Configuración vigente: <strong>{m.matrix.name}</strong> {m.matrix.version}, publicada por {m.matrix.createdBy.name} el {formatDateTime(m.matrix.createdAt)}</> : 'Criterios y niveles de riesgo.'}
        />
        <AsyncContent isLoading={m.isLoading} error={m.loadError} onRetry={m.retryLoad} label="la matriz vigente">
          {m.matrix && (
            <>
              <Tabs label="Componentes de la matriz" value={tab} onChange={setTab}
                tabs={[{ id: MATRIX_TABS.MATRIX, label: 'Matriz 5×5' }, { id: MATRIX_TABS.PROBABILITY, label: 'Probabilidad' }, { id: MATRIX_TABS.IMPACT, label: 'Impacto' }]} />
              {tab === MATRIX_TABS.PROBABILITY && <MatrixCriteriaList title="Criterios de probabilidad" criteria={m.matrix.probabilityCriteria} />}
              {tab === MATRIX_TABS.IMPACT && <MatrixCriteriaList title="Criterios de impacto" criteria={m.matrix.impactCriteria} />}
              {tab === MATRIX_TABS.MATRIX && (
                <Card aria-labelledby="matrix-grid-title" className="p-4 md:p-5">
                  <SectionTitle id="matrix-grid-title">Niveles por celda</SectionTitle>
                  <p className="mb-3 mt-1 text-sm text-muted">
                    {canEdit
                      ? 'Selecciona una celda (o usa las flechas y Enter) para cambiar su nivel. Guardar crea una nueva configuración sin alterar las evaluaciones históricas.'
                      : 'Modo consulta: solo un administrador puede modificar la matriz.'}
                  </p>
                  <Matrix5x5EditorGrid
                    probabilityCriteria={m.matrix.probabilityCriteria}
                    impactCriteria={m.matrix.impactCriteria}
                    levelAt={m.levelAt}
                    isChanged={m.isCellChanged}
                    onCycle={canEdit ? m.cycleCell : undefined}
                  />
                  {canEdit && (
                    <footer className="mt-4 flex flex-wrap items-center gap-2">
                      <Button disabled={!m.isDirty} onClick={() => setConfirming(true)}>Guardar como nueva versión</Button>
                      <Button variant="ghost" disabled={!m.isDirty} onClick={m.discard}>Descartar cambios</Button>
                      {m.isDirty && <span role="status" className="text-xs text-muted">{m.changedCells} {m.changedCells === 1 ? 'celda modificada' : 'celdas modificadas'}</span>}
                    </footer>
                  )}
                </Card>
              )}
            </>
          )}
        </AsyncContent>
      </main>
      <PublishMatrixDialog
        open={confirming}
        currentName={m.matrix?.name ?? ''}
        changedCells={m.changedCells}
        isPublishing={m.isPublishing}
        onClose={() => setConfirming(false)}
        onPublish={m.publishDraft}
      />
    </>
  )
}
