import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, GitMerge, Server } from 'lucide-react'
import FormAlert from '@/components/forms/FormAlert'
import { applyServerErrors } from '@/components/forms/applyServerErrors'
import { Button, CriticalityBadge, Field } from '@/components/ui'
import type { SubmitResult } from '@/lib/apiErrors'
import { formatDateTime } from '@/lib/format'
import { cn, inputClassName } from '@/lib/utils'
import { confirmGroupingFormSchema, type ConfirmGroupingValues } from '@/schemas/riskEvaluation.schema'
import type { Asset, RiskVersion } from '@/types/domain.types'

interface GroupingConfirmationFieldsetProps {
  version: RiskVersion
  assets: Asset[]
  reportedAssetIds: number[]
  includedCount: number
  editable: boolean
  isSubmitting: boolean
  onConfirm: (values: ConfirmGroupingValues) => Promise<SubmitResult>
}

/** Confirmación del activo afectado definitivo y de la agrupación (POST /risk-versions/{id}/confirm-grouping/). */
export default function GroupingConfirmationFieldset({ version, assets, reportedAssetIds, includedCount, editable, isSubmitting, onConfirm }: GroupingConfirmationFieldsetProps) {
  const [correcting, setCorrecting] = useState(false)
  const { grouping, confirmedAsset } = version
  const showForm = editable && (!grouping.confirmed || correcting)

  return (
    <section aria-labelledby="grouping-heading" className="rounded-[18px] border border-line bg-white p-4 shadow-card md:rounded-[14px] md:p-5">
      <h2 id="grouping-heading" className="mb-1 flex items-center gap-2 text-[15px] font-semibold"><Server size={18} className="text-primary" aria-hidden />Activo afectado y confirmación de la agrupación</h2>
      <p className="mb-3 text-[12px] text-muted">Activo identificado por la IA: <strong className="text-ink">{version.identifiedAsset ?? 'No determinado'}</strong></p>

      {grouping.confirmed && !correcting && (
        <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[10px] bg-canvas p-3 text-[13px]" role="status">
          <CheckCircle2 size={16} className="text-primary" aria-hidden />
          <span>Activo confirmado: <strong>{confirmedAsset?.name ?? '—'}</strong></span>
          {confirmedAsset?.criticality && <CriticalityBadge criticality={confirmedAsset.criticality} />}
          <span className="basis-full text-[12px] text-muted">Agrupación confirmada por {grouping.confirmedByName ?? '—'}{grouping.confirmedAt && ` · ${formatDateTime(grouping.confirmedAt)}`}</span>
        </p>
      )}
      {!grouping.confirmed && !editable && <p className="text-[13px] text-muted">La agrupación aún no ha sido confirmada por un analista.</p>}

      {showForm ? (
        <GroupingForm
          key={`${confirmedAsset?.id ?? 'none'}-${reportedAssetIds.join(',')}`}
          defaultAssetId={confirmedAsset?.id ?? (reportedAssetIds.length === 1 ? reportedAssetIds[0] : undefined)}
          assets={assets} reportedAssetIds={reportedAssetIds} includedCount={includedCount} isSubmitting={isSubmitting}
          onCancel={grouping.confirmed ? () => setCorrecting(false) : undefined}
          onConfirm={async (values) => {
            const failure = await onConfirm(values)
            if (!failure) setCorrecting(false)
            return failure
          }}
        />
      ) : editable && grouping.confirmed && (
        <Button size="sm" variant="ghost" onClick={() => setCorrecting(true)}>Cambiar activo confirmado</Button>
      )}
    </section>
  )
}

interface GroupingFormProps {
  defaultAssetId?: number
  assets: Asset[]
  reportedAssetIds: number[]
  includedCount: number
  isSubmitting: boolean
  onCancel?: () => void
  onConfirm: (values: ConfirmGroupingValues) => Promise<SubmitResult>
}

function GroupingForm({ defaultAssetId, assets, reportedAssetIds, includedCount, isSubmitting, onCancel, onConfirm }: GroupingFormProps) {
  const schema = useMemo(() => confirmGroupingFormSchema(reportedAssetIds), [reportedAssetIds])
  const { register, handleSubmit, setError, control, formState: { errors } } = useForm<ConfirmGroupingValues>({
    resolver: zodResolver(schema),
    defaultValues: { activo_confirmado_id: defaultAssetId, justificacion_cambio_activo: '' },
  })
  const assetId = useWatch({ control, name: 'activo_confirmado_id' })
  const selected = assets.find((a) => a.id === assetId)
  const changed = assetId !== undefined && reportedAssetIds.length > 0 && !reportedAssetIds.includes(assetId)

  const submit = handleSubmit(async (values) => {
    const failure = await onConfirm(values)
    if (failure) applyServerErrors(failure, setError, ['activo_confirmado_id', 'justificacion_cambio_activo'])
  })

  return (
    <form noValidate aria-label="Confirmación del activo y la agrupación" onSubmit={submit} className="space-y-3">
      <FormAlert message={errors.root?.server?.message} />
      <fieldset className="min-w-0 space-y-3">
        <legend className="sr-only">Activo afectado definitivo</legend>
        <Field id="grouping-asset" label="Activo afectado definitivo" error={errors.activo_confirmado_id?.message}>
          <select id="grouping-asset" {...register('activo_confirmado_id', { setValueAs: (v) => (v === '' || v === undefined ? undefined : Number(v)) })}
            aria-invalid={!!errors.activo_confirmado_id} className={cn(inputClassName(!!errors.activo_confirmado_id), 'h-11 md:h-10')}>
            <option value="">Selecciona un activo del catálogo</option>
            {assets.map((a) => <option key={a.id} value={a.id}>{a.name}{reportedAssetIds.includes(a.id) ? ' (reportado)' : ''}</option>)}
          </select>
        </Field>
        {selected?.criticality && <p className="flex items-center gap-2 text-[12px]" aria-live="polite"><CriticalityBadge criticality={selected.criticality} /></p>}
        {changed && (
          <Field id="grouping-justification" label="Justificación del cambio de activo" error={errors.justificacion_cambio_activo?.message}
            help="El activo elegido no coincide con el reportado en las incidencias.">
            <textarea id="grouping-justification" rows={2} {...register('justificacion_cambio_activo')} aria-invalid={!!errors.justificacion_cambio_activo}
              className={cn(inputClassName(!!errors.justificacion_cambio_activo), 'py-2')} />
          </Field>
        )}
      </fieldset>
      <footer className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" full variant="secondary" icon={<GitMerge size={17} aria-hidden />} disabled={isSubmitting || includedCount === 0}>
          {isSubmitting ? 'Confirmando…' : `Confirmar agrupación (${includedCount})`}
        </Button>
        {onCancel && <Button variant="ghost" onClick={onCancel}>Cancelar</Button>}
      </footer>
    </form>
  )
}
