import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BasemapId } from '../data/basemaps'

interface UiState {
  /** Is the side panel (bottom panel on phones) expanded? */
  panelOpen: boolean
  basemap: BasemapId
  /** Is the map's time-slider card expanded (slider + legend) or just play + time? */
  mapControlsOpen: boolean
  setPanelOpen: (open: boolean) => void
  setBasemap: (basemap: BasemapId) => void
  setMapControlsOpen: (open: boolean) => void
}

/**
 * First visit: the map style follows the device's light / dark setting.
 * After that, the user's own choice (saved below) wins.
 */
function deviceBasemap(): BasemapId {
  const prefersLight = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches
  return prefersLight ? 'light' : 'dark'
}

/**
 * The user's display preferences. Like the saved places, they persist in
 * localStorage, so the app opens the way the user left it.
 */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      panelOpen: true,
      basemap: deviceBasemap(),
      mapControlsOpen: true,
      setPanelOpen: (panelOpen) => set({ panelOpen }),
      setBasemap: (basemap) => set({ basemap }),
      setMapControlsOpen: (mapControlsOpen) => set({ mapControlsOpen }),
    }),
    {
      name: 'weather-explorer:ui', // localStorage key
    },
  ),
)
