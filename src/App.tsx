import { useState } from 'react'
import { WeatherMap } from './components/map/WeatherMap'
import { SearchBox } from './components/ui/SearchBox'
import type { Place } from './types'

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

  return (
    <div className="flex h-full flex-col md:flex-row">
      <aside className="order-2 flex h-1/2 w-full flex-col border-slate-800 bg-slate-900 md:order-1 md:h-full md:w-96 md:border-r">
        <header className="border-b border-slate-800 p-4">
          <h1 className="text-lg font-semibold">Weather Explorer</h1>
          <p className="text-sm text-slate-400">Explore the weather anywhere in the world</p>
        </header>

        <div className="flex-1 overflow-y-auto p-4 text-sm text-slate-400">
          {selected ? (
            <div>
              <div className="text-base text-slate-100">{selected.name}</div>
              <div>{selected.subtitle}</div>
              <div className="mt-2 text-xs">Weather details come in Step 3.</div>
            </div>
          ) : (
            'Search for a city or click anywhere on the map.'
          )}
        </div>
      </aside>

      <main className="relative order-1 h-1/2 flex-1 md:order-2 md:h-full">
        <WeatherMap selected={selected} onSelect={setSelected} />

        {/* Floats above the map. Leaflet panes use z-index up to ~1000, so we go higher. */}
        <div className="absolute top-3 right-3 left-3 z-[1100] sm:right-auto sm:w-80">
          <SearchBox onSelect={setSelected} />
        </div>
      </main>
    </div>
  )
}

export default App
