import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Citation } from '@/types/domain.types'

export interface UIState {
  citationDrawerOpen: boolean
  activeCitation: Citation | null
}

const initialState: UIState = { citationDrawerOpen: false, activeCitation: null }

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openCitationDrawer: (state, action: PayloadAction<Citation>) => {
      state.citationDrawerOpen = true
      state.activeCitation = action.payload
    },
    closeCitationDrawer: (state) => {
      state.citationDrawerOpen = false
      state.activeCitation = null
    },
  },
  selectors: {
    selectCitationDrawerOpen: (state) => state.citationDrawerOpen,
    selectActiveCitation: (state) => state.activeCitation,
  },
})

export const { openCitationDrawer, closeCitationDrawer } = uiSlice.actions
export const { selectCitationDrawerOpen, selectActiveCitation } = uiSlice.selectors
export default uiSlice
