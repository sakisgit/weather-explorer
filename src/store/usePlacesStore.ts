import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Place } from '../types'

/** Keeps the compare request (one location per saved place) small. */
export const MAX_SAVED_PLACES = 12

interface PlacesState {
  places: Place[]
  addPlace: (place: Place) => void
  removePlace: (id: string) => void
}

/**
 * The user's collection of places (CLIENT state, so Zustand, not TanStack Query).
 *
 * `persist` saves the state to localStorage on every change and restores it on load,
 * so the collection survives page reloads. No backend or account needed.
 *
 * Components subscribe with a selector, e.g. `usePlacesStore((s) => s.places)`,
 * and only re-render when THAT slice changes.
 */
export const usePlacesStore = create<PlacesState>()(
  persist(
    (set) => ({
      places: [],
      addPlace: (place) =>
        set((state) => {
          const exists = state.places.some((p) => p.id === place.id)
          if (exists || state.places.length >= MAX_SAVED_PLACES) return state
          return { places: [...state.places, place] }
        }),
      removePlace: (id) => set((state) => ({ places: state.places.filter((p) => p.id !== id) })),
    }),
    {
      name: 'weather-explorer:places', // localStorage key
      version: 1, // bump + add `migrate` if the Place shape ever changes
      partialize: (state) => ({ places: state.places }), // persist data only, not functions
    },
  ),
)
