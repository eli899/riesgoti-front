import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import {
  closeCitationDrawer,
  openCitationDrawer,
  selectActiveCitation,
  selectCitationDrawerOpen,
} from '@/features/ui/uiSlice'
import type { Citation } from '@/types/domain.types'

/** Caso de uso de inspección de citas normativas en el panel lateral. */
export function useCitationDrawer() {
  const dispatch = useAppDispatch()
  const isOpen = useAppSelector(selectCitationDrawerOpen)
  const activeCitation = useAppSelector(selectActiveCitation)

  const inspectCitation = useCallback((citation: Citation) => dispatch(openCitationDrawer(citation)), [dispatch])
  const closeDrawer = useCallback(() => dispatch(closeCitationDrawer()), [dispatch])

  return { isOpen, activeCitation, inspectCitation, closeDrawer }
}
