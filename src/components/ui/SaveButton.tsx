import { Star } from 'lucide-react'
import { MAX_SAVED_PLACES, usePlacesStore } from '../../store/usePlacesStore'
import type { Place } from '../../types'

/** Star toggle: add/remove the place from "My places". */
export function SaveButton({ place }: { place: Place }) {
  // Selectors: this button only re-renders when these specific values change.
  const isSaved = usePlacesStore((s) => s.places.some((p) => p.id === place.id))
  const isFull = usePlacesStore((s) => s.places.length >= MAX_SAVED_PLACES)
  const addPlace = usePlacesStore((s) => s.addPlace)
  const removePlace = usePlacesStore((s) => s.removePlace)

  const disabled = !isSaved && isFull

  return (
    <button
      type="button"
      onClick={() => (isSaved ? removePlace(place.id) : addPlace(place))}
      disabled={disabled}
      aria-pressed={isSaved}
      title={disabled ? `You can save up to ${MAX_SAVED_PLACES} places` : undefined}
      className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        isSaved
          ? 'border-amber-500/60 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
          : 'border-slate-700 text-slate-300 hover:border-amber-500/60 hover:text-amber-300'
      }`}
    >
      {/* Filled star when saved, outline when not */}
      <Star className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} aria-hidden />
      {isSaved ? 'Saved' : 'Save'}
    </button>
  )
}
