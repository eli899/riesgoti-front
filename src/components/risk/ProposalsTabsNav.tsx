import { Tabs } from '@/components/ui'

interface ProposalsTabsNavProps<T extends string> {
  tabs: { id: T; label: string; count?: number }[]
  value: T
  onChange: (tab: T) => void
}

/** Pestañas de clasificación de la bandeja de propuestas (nuevas agrupaciones, pendientes de revisión, rechazadas). */
export default function ProposalsTabsNav<T extends string>({ tabs, value, onChange }: ProposalsTabsNavProps<T>) {
  return <Tabs label="Clasificación de propuestas de riesgo" tabs={tabs} value={value} onChange={onChange} />
}
