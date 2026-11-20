import { useCallback, useState } from 'react'
import type { LatLon } from './api/types'
import { WeatherMap } from './components/map/WeatherMap'
import { PlaceDetails } from './components/panels/PlaceDetails'
import { LocateButton } from './components/ui/LocateButton'
import { SearchBox } from './components/ui/SearchBox'
import { useGeolocation } from './hooks/useGeolocation'
import type { Place } from './types'
import { placeFromCoords } from './utils/places'

/**
 * Root layout.
 *
 * Desktop: the map fills the screen and a side panel sits on the left.
 * Mobile:  the map takes the top part and the panel stacks underneath it.
 *
 * `selected` lives here because both the map (marker, fly-to) and the panel
 * (details) need it: "lift state up" to the closest common parent.
 */
function App() {
  const [selected, setSelected] = useState<Place | null>(null)
  const [myLocation, setMyLocation] = useState<LatLon | null>(null)

  // useCallback: a stable function, so the hook doesn't see a "new" callback every render.
  const onLocated = useCallback((pos: LatLon) => {
    setMyLocation(pos)
    setSelected(placeFromCoords(pos.lat, pos.lon, 'My location'))
  }, [])
  const geo = useGeolocation({ onLocated })

  return (
    <div className="flex h-full flex-col md:flex-row">
      <aside className="order-2 flex h-1/2 w-full flex-col border-slate-800 bg-slate-900 md:order-1 md:h-full md:w-96 md:border-r">
        <header className="border-b border-slate-800 p-4">
          <h1 className="text-lg font-semibold">Weather Explorer</h1>
          <p className="text-sm text-slate-400">Explore the weather anywhere in the world</p>
        </header>

        <div className="flex-1 overflow-y-auto p-4 text-sm text-slate-400">
          {selected ? (
            <PlaceDetails place={selected} />
          ) : (
            <EmptyState onLocate={geo.locate} />
          )}
        </div>
      </aside>

      <main className="relative order-1 h-1/2 flex-1 md:order-2 md:h-full">
        <WeatherMap selected={selected} myLocation={myLocation} onSelect={setSelected} />

        {/* Floats above the map. Leaflet panes use z-index up to ~1000, so we go higher. */}
        <div className="absolute top-3 right-3 left-3 z-[1100] sm:right-auto sm:w-96">
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchBox onSelect={setSelected} />
            </div>
            <LocateButton onClick={geo.locate} locating={geo.status === 'locating'} />
          </div>

          {geo.error && (
            <div
              role="alert"
              className="mt-2 flex items-start gap-2 rounded-lg border border-amber-800 bg-slate-900/95 p-3 text-xs text-amber-200 shadow-lg"
            >
              <span className="flex-1">{geo.error}</span>
              <button onClick={geo.clearError} aria-label="Dismiss" className="text-amber-400 hover:text-amber-200">
                ✕
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function EmptyState({ onLocate }: { onLocate: () => void }) {
  return (
    <div className="space-y-3">
      <p>Search for a city, click anywhere on the map, or see the weather where you are.</p>
      <button
        onClick={onLocate}
        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
      >
        📍 Use my location
      </button>
    </div>
  )
}

export default App
