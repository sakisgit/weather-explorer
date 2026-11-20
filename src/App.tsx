import { useCallback, useState } from 'react'
import type { LatLon } from './api/types'
import { WeatherMap } from './components/map/WeatherMap'
import { PlaceDetails } from './components/panels/PlaceDetails'
import { SavedPlaces } from './components/panels/SavedPlaces'
import { ChevronRight, CloudSun, MapPin, Star, X } from 'lucide-react'
import { BasemapSwitcher } from './components/ui/BasemapSwitcher'
import { LocateButton } from './components/ui/LocateButton'
import { SearchBox } from './components/ui/SearchBox'
import { useGeolocation } from './hooks/useGeolocation'
import { usePlacesStore } from './store/usePlacesStore'
import { useUiStore } from './store/useUiStore'
import type { Place } from './types'
import { placeFromCoords } from './utils/places'

type Tab = 'details' | 'places'

/**
 * Root layout.
 *
 * Desktop: the map fills the screen and a side panel sits on the left.
 * Mobile:  the map takes the top part and the panel stacks underneath it.
 *
 * `selected` lives here because both the map (marker, fly-to) and the panel
 * (details) need it: "lift state up" to the closest common parent.
 * Saved places live in a Zustand store instead, because they must persist and
 * are read by several unrelated components (panel, save button, map markers).
 */
function App() {
  const [selected, setSelected] = useState<Place | null>(null)
  const [myLocation, setMyLocation] = useState<LatLon | null>(null)
  const [tab, setTab] = useState<Tab>('details')
  const savedCount = usePlacesStore((s) => s.places.length)
  // Collapsed or expanded panel: a persisted preference (useUiStore).
  const panelOpen = useUiStore((s) => s.panelOpen)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)

  // Selecting a place from anywhere (search, map, city, saved list) shows its details,
  // so a collapsed panel opens again: that's where the details are.
  const selectPlace = useCallback(
    (place: Place) => {
      setSelected(place)
      setTab('details')
      setPanelOpen(true)
    },
    [setPanelOpen],
  )

  // useCallback: a stable function, so the hook doesn't see a "new" callback every render.
  const onLocated = useCallback(
    (pos: LatLon) => {
      setMyLocation(pos)
      selectPlace(placeFromCoords(pos.lat, pos.lon, 'My location'))
    },
    [selectPlace],
  )
  const geo = useGeolocation({ onLocated })

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/*
        Expanded: a 384px side panel (desktop) or the bottom half of the screen (phone).
        Collapsed: a narrow strip with the icon and the toggle (desktop), or just the
        title bar (phone), and the map takes the freed space.
      */}
      <aside
        id="side-panel"
        className={`order-2 flex w-full flex-col border-slate-800 bg-slate-900 transition-[width] duration-200 md:order-1 md:h-full md:border-r ${
          panelOpen ? 'h-1/2 md:w-96' : 'md:w-14'
        }`}
      >
        <header className={`border-slate-800 px-4 pt-4 ${panelOpen ? 'border-b' : 'pb-3 md:px-2.5 md:pb-0'}`}>
          <div className={`flex items-center gap-3 ${panelOpen ? '' : 'md:flex-col'}`}>
            {/* Same file as the browser-tab icon (public/favicon.svg). Decorative: the title says it all. */}
            <img src="/favicon.svg" alt="" className="h-9 w-9 shrink-0 drop-shadow" />
            <div className={`min-w-0 flex-1 ${panelOpen ? '' : 'md:hidden'}`}>
              <h1 className="truncate text-lg leading-tight font-semibold tracking-tight">Weather Explorer</h1>
              {panelOpen && (
                <p className="hidden text-xs text-slate-400 md:block">Explore the weather anywhere in the world</p>
              )}
            </div>
            <PanelToggle open={panelOpen} onClick={() => setPanelOpen(!panelOpen)} />
          </div>

          {/*
            Collapsed on desktop: the tabs become an icon rail (like VS Code or Google Maps),
            so each one is a click away. The panel opens straight on that tab.
          */}
          {!panelOpen && (
            <nav
              aria-label="Panel"
              className="mt-4 hidden flex-col items-center gap-2 border-t border-slate-800 pt-4 md:flex"
            >
              <RailButton
                label="Details"
                active={tab === 'details'}
                onClick={() => {
                  setTab('details')
                  setPanelOpen(true)
                }}
              >
                <CloudSun className="h-5 w-5" aria-hidden />
              </RailButton>
              <RailButton
                label={`My places${savedCount > 0 ? ` (${savedCount})` : ''}`}
                active={tab === 'places'}
                onClick={() => {
                  setTab('places')
                  setPanelOpen(true)
                }}
              >
                <Star className="h-5 w-5" aria-hidden />
                {savedCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 rounded-full bg-amber-500 px-1 text-[10px] leading-4 font-semibold text-slate-950">
                    {savedCount}
                  </span>
                )}
              </RailButton>
            </nav>
          )}

          {panelOpen && (
            <nav role="tablist" aria-label="Panel" className="mt-3 flex gap-1">
              <TabButton active={tab === 'details'} onClick={() => setTab('details')}>
                Details
              </TabButton>
              <TabButton active={tab === 'places'} onClick={() => setTab('places')}>
                <Star className="mr-1 inline h-3.5 w-3.5 -translate-y-px" aria-hidden />
                My places{savedCount > 0 && <span className="ml-1 text-slate-400">({savedCount})</span>}
              </TabButton>
            </nav>
          )}
        </header>

        {panelOpen && (
          <div role="tabpanel" className="flex-1 overflow-y-auto p-4 text-sm text-slate-400">
            {tab === 'places' ? (
              <SavedPlaces onSelect={selectPlace} />
            ) : selected ? (
              <PlaceDetails place={selected} />
            ) : (
              <EmptyState onLocate={geo.locate} />
            )}
          </div>
        )}
      </aside>

      <main className={`@container relative order-1 min-h-0 flex-1 md:order-2 md:h-full ${panelOpen ? 'h-1/2' : ''}`}>
        <WeatherMap selected={selected} myLocation={myLocation} onSelect={selectPlace} />

        {/*
          The map is a CSS container (@container above): the floating controls adapt to the
          MAP's width (@lg:, @2xl:), not the screen's. With the side panel open on a tablet,
          the screen is wide but the map is narrow.
        */}
        {/* Floats above the map. Leaflet panes use z-index up to ~1000, so we go higher. */}
        <div className="absolute top-3 right-3 left-3 z-[1100] @lg:right-auto @lg:w-[27rem]">
          {/* data-map-obstacle: the map won't place city labels under this element */}
          <div className="flex gap-2" data-map-obstacle>
            <div className="flex-1">
              <SearchBox onSelect={selectPlace} />
            </div>
            <LocateButton onClick={geo.locate} locating={geo.status === 'locating'} />
            <BasemapSwitcher />
          </div>

          {geo.error && (
            <div
              role="alert"
              className="mt-2 flex items-start gap-2 rounded-lg border border-amber-800 bg-slate-900/95 p-3 text-xs text-amber-200 shadow-lg"
            >
              <span className="flex-1">{geo.error}</span>
              <button onClick={geo.clearError} aria-label="Dismiss" className="text-amber-400 hover:text-amber-200">
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
        active ? 'border-sky-500 text-slate-100' : 'border-transparent text-slate-400 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  )
}

/** An icon button of the collapsed panel's rail. The label is the tooltip and the screen-reader name. */
function RailButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
        active ? 'bg-sky-500/15 text-sky-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * Arrow that collapses / expands the panel. One chevron icon, rotated to point the
 * way the panel will move: left/right on desktop (side panel), down/up on phones
 * (bottom panel).
 */
function PanelToggle({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-controls="side-panel"
      aria-label={open ? 'Collapse panel' : 'Expand panel'}
      title={open ? 'Collapse panel' : 'Expand panel'}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:border-sky-500 hover:text-sky-400"
    >
      {/* Chevron pointing right; the rotation turns it */}
      <ChevronRight
        className={`h-4 w-4 transition-transform ${open ? 'rotate-90 md:rotate-180' : '-rotate-90 md:rotate-0'}`}
        strokeWidth={2.5}
        aria-hidden
      />
    </button>
  )
}

function EmptyState({ onLocate }: { onLocate: () => void }) {
  return (
    <div className="space-y-3">
      <p>Search for a city, click a city or anywhere on the map, or see the weather where you are.</p>
      <button
        onClick={onLocate}
        className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
      >
        <MapPin className="h-4 w-4" aria-hidden />
        Use my location
      </button>
    </div>
  )
}

export default App
