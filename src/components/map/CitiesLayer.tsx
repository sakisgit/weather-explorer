import L from 'leaflet'
import { ChevronRight } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Marker, Pane, useMap, useMapEvents } from 'react-leaflet'
import { useCurrentUtcHour } from '../../hooks/useCurrentUtcHour'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useMapWeather } from '../../hooks/useMapWeather'
import type { LatLon } from '../../api/types'
import { usePlacesStore } from '../../store/usePlacesStore'
import { useUiStore } from '../../store/useUiStore'
import type { Place } from '../../types'
import { readObstacles } from '../../utils/mapObstacles'
import { type MapView, type VisibleCity, placeFromCity, selectVisibleCities } from '../../utils/cities'
import { temperatureColor } from '../../utils/temperatureColor'
import { addHoursToSlot, dayStartTicks, formatSlotForUser } from '../../utils/time'
import { getWeatherInfo, weatherIconUrl } from '../../utils/weatherCodes'
import { TimeSlider } from '../ui/TimeSlider'

/**
 * Lucide's star as an HTML string: the city labels are plain HTML (a Leaflet DivIcon),
 * not React, so the icon component can't be used there.
 */
const STAR_SVG =
  '<svg class="city-star" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>'

interface Props {
  selected: Place | null
  myLocation: LatLon | null
  onSelect: (place: Place) => void
}

type Highlight = 'selected' | 'me' | null

// The label's box around its coordinate, in pixels (see iconAnchor below).
// A point inside this box would be hidden by the label.
const LABEL_HALF_WIDTH = 32
const LABEL_ABOVE = 18
const LABEL_BELOW = 34

const MAX_HOURS = 48
const PLAY_STEP_MS = 600 // one forecast hour every 0.6 s: the full 48 h take ~30 s

/**
 * The "TV forecast" layer: city names with a weather icon and temperature.
 *
 * Flow: map moves -> (debounce 400 ms) -> pick visible cities for this zoom ->
 * fetch only the cities not in cache (one batched request) -> draw markers.
 */
export function CitiesLayer({ selected, myLocation, onSelect }: Props) {
  const map = useMap()
  const view = useMapView()
  const savedPlaces = usePlacesStore((s) => s.places)
  // Collapsed timeline = just play + time, so the map is almost free (persisted preference).
  const controlsOpen = useUiStore((s) => s.mapControlsOpen)
  const setControlsOpen = useUiStore((s) => s.setMapControlsOpen)
  // Wait until the user stops panning/zooming before requesting anything.
  const settledView = useDebouncedValue(view, 400)
  const cities = useMemo(() => selectVisibleCities(settledView), [settledView])
  const points = useMemo(() => cities.map((c) => c.api), [cities])
  const { data, isFetching, isError } = useMapWeather(points)

  // Time slider state. Changing the hour re-reads data we ALREADY have
  // (72 hourly values per city), so scrubbing/playing makes zero requests.
  const [hourOffset, setHourOffset] = useState(0)
  const [playing, setPlaying] = useState(false)

  // Play runs ONCE to +48 h and stops there (it doesn't loop). One timeout per step:
  // each new hour schedules the next one, and pausing (or unmounting) cancels it.
  useEffect(() => {
    if (!playing) return
    const id = setTimeout(() => {
      if (hourOffset >= MAX_HOURS) setPlaying(false)
      else setHourOffset(hourOffset + 1)
    }, PLAY_STEP_MS)
    return () => clearTimeout(id)
  }, [playing, hourOffset])

  const togglePlay = () => {
    // Pressing play at the end starts again from "Now".
    if (!playing && hourOffset >= MAX_HOURS) setHourOffset(0)
    setPlaying(!playing)
  }

  // All cities use the same UTC hour, so the whole map shows the same moment.
  const nowSlot = useCurrentUtcHour()
  const slot = addHoursToSlot(nowSlot, hourOffset)
  const dayTicks = useMemo(() => dayStartTicks(nowSlot, MAX_HOURS), [nowSlot])

  return (
    <>
      {/*
        Own pane ABOVE the "points" pane (selected / my-location / saved dots, z-index 340).
        A dot that falls under a label would be hidden, so instead that label is
        highlighted (see `highlight` and `saved`): the label "becomes" the marker.
      */}
      <Pane name="cities" style={{ zIndex: 350 }}>
        {cities.map((city) => {
          const forecast = data?.get(`${city.api.lat},${city.api.lon}`)
          const i = forecast ? forecast.hourly.time.indexOf(slot) : -1
          if (!forecast || i === -1) return null
          const covers = (p: LatLon) => labelCoversPoint(map, view.zoom, city, p)
          const highlight: Highlight =
            selected && covers(selected) ? 'selected' : myLocation && covers(myLocation) ? 'me' : null
          return (
            <CityMarker
              key={`${city.name}-${city.displayLon}`}
              city={city}
              temperature={forecast.hourly.temperature_2m[i]}
              weatherCode={forecast.hourly.weather_code[i]}
              isDay={forecast.hourly.is_day[i] === 1}
              highlight={highlight}
              saved={savedPlaces.some(covers)}
              onSelect={onSelect}
            />
          )
        })}
      </Pane>

      <Timeline collapsed={!controlsOpen}>
        <TimeSlider
          compact={!controlsOpen}
          dayTicks={dayTicks}
          status={
            isFetching ? (
              <span className="text-sky-400">Updating…</span>
            ) : isError ? (
              <span className="text-amber-400" title="Map data unavailable">
                Data unavailable
              </span>
            ) : undefined
          }
          trailing={<CollapseButton open={controlsOpen} onClick={() => setControlsOpen(!controlsOpen)} />}
          value={hourOffset}
          max={MAX_HOURS}
          onChange={(h) => {
            setPlaying(false) // grabbing the slider stops the animation
            setHourOffset(h)
          }}
          playing={playing}
          onTogglePlay={togglePlay}
          label={formatSlotForUser(slot)}
        />
      </Timeline>
    </>
  )
}

/** Tracks the visible bounds + zoom, updated when a move/zoom ends. */
function useMapView(): MapView {
  const map = useMap()
  const read = useCallback((): MapView => {
    const b = map.getBounds()
    return {
      south: b.getSouth(),
      west: b.getWest(),
      north: b.getNorth(),
      east: b.getEast(),
      zoom: map.getZoom(),
      obstacles: readObstacles(map.getContainer()),
    }
  }, [map])

  const [view, setView] = useState(read)
  // The floating UI isn't laid out yet on the very first render: read again on the next frame.
  useEffect(() => {
    const id = requestAnimationFrame(() => setView(read()))
    return () => cancelAnimationFrame(id)
  }, [read])
  useMapEvents({
    moveend: () => setView(read()), // fires after both pans and zooms
    resize: () => setView(read()),
  })
  return view
}

/**
 * Would this city's label (drawn at the current zoom) cover the given point?
 * Measured in screen pixels, so it works the same at every zoom level.
 */
function labelCoversPoint(map: L.Map, zoom: number, city: VisibleCity, point: LatLon): boolean {
  // Bring the point onto the same copy of the world as the label (±360°).
  const lon = point.lon + 360 * Math.round((city.displayLon - point.lon) / 360)
  const a = map.project([city.lat, city.displayLon], zoom)
  const b = map.project([point.lat, lon], zoom)
  const dx = b.x - a.x
  const dy = b.y - a.y // positive = below the city coordinate
  return Math.abs(dx) <= LABEL_HALF_WIDTH && dy >= -LABEL_ABOVE && dy <= LABEL_BELOW
}

interface MarkerProps {
  city: VisibleCity
  temperature: number
  weatherCode: number
  isDay: boolean
  highlight: Highlight
  saved: boolean
  onSelect: (place: Place) => void
}

/**
 * One city label: big icon, temperature (colored by the scale) and name. No box,
 * so the basemap stays visible. `memo` skips re-rendering markers whose values
 * didn't change, and the DivIcon is only rebuilt when the displayed values change.
 */
const CityMarker = memo(function CityMarker({
  city,
  temperature,
  weatherCode,
  isDay,
  highlight,
  saved,
  onSelect,
}: MarkerProps) {
  const info = getWeatherInfo(weatherCode, isDay)
  const rounded = Math.round(temperature)
  const color = temperatureColor(temperature)
  const labelClass = highlight ? `city-label is-highlighted is-${highlight}` : 'city-label'

  const icon = useMemo(
    () =>
      L.divIcon({
        className: 'city-marker', // replaces Leaflet's default white box styling
        iconSize: [120, 52],
        iconAnchor: [60, 18], // the icon (not the name) sits on the city's coordinate
        // The hover text lives in the HTML: it is rebuilt with the icon, so it always matches
        // the displayed hour (Leaflet's `title` option is only read once, when the marker is created).
        html: `<div class="${labelClass}" style="--temp-color:${color}" title="${city.name}: ${info.label}, ${rounded}°C">
                 <div class="city-row"><img class="city-icon" src="${weatherIconUrl(info.icon, false)}" alt="" /><span class="city-temp">${rounded}°</span></div>
                 <div class="city-name">${saved ? STAR_SVG : ''}${city.name}</div>
               </div>`,
      }),
    [color, info.icon, info.label, rounded, city.name, labelClass, saved],
  )

  return (
    <Marker
      position={[city.lat, city.displayLon]}
      icon={icon}
      pane="cities"
      alt={city.name}
      eventHandlers={{ click: () => onSelect(placeFromCity(city)) }}
    />
  )
})

/**
 * The timeline bar: centered at the bottom of the map (phones: full width, left of the zoom buttons).
 * The temperature legend is a separate control above the zoom buttons (TemperatureLegend.tsx).
 *
 * This bar lives INSIDE the Leaflet map container, so by default every click
 * or drag on it would also reach the map (dragging the slider would pan the map,
 * clicking would select a point). Leaflet's DomEvent helpers stop that.
 */
function Timeline({ collapsed, children }: { collapsed: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    L.DomEvent.disableClickPropagation(ref.current)
    L.DomEvent.disableScrollPropagation(ref.current) // scrolling over the bar doesn't zoom the map
  }, [])

  return (
    <div
      ref={ref}
      data-map-obstacle // the map won't place city labels under this bar
      // Narrow map (phones, tablets with the panel open): above the attribution, which wraps to
      // two lines there. Wide map (@2xl = 42rem+, a container query on the map): centered, at most 36rem wide,
      // leaving room for the zoom buttons. Collapsed: only as wide as its content.
      className={`absolute bottom-12 left-3 z-[1000] rounded-xl border border-slate-700/60 bg-slate-900/90 py-2 pr-2 pl-2 text-slate-300 shadow-lg backdrop-blur @2xl:bottom-6 @2xl:left-1/2 @2xl:-translate-x-1/2 @2xl:pr-3 ${
        collapsed ? '' : 'right-14 @2xl:right-auto @2xl:w-[min(36rem,calc(100%-9rem))]'
      }`}
    >
      {children}
    </div>
  )
}

/** Collapses the timeline to just play + time, or expands it again. The chevron points the way it will move. */
function CollapseButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-label={open ? 'Collapse time controls' : 'Expand time controls'}
      title={open ? 'Collapse' : 'Expand'}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-sky-400"
    >
      <ChevronRight
        className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : '-rotate-90'}`}
        strokeWidth={2.5}
        aria-hidden
      />
    </button>
  )
}
