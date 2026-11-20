import L from 'leaflet'
import { memo, useCallback, useMemo, useState } from 'react'
import { Marker, Pane, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useWeatherGrid } from '../../hooks/useWeatherGrid'
import type { Place } from '../../types'
import { useCurrentUtcHour } from '../../hooks/useCurrentUtcHour'
import { type MapView, addHoursToSlot, buildGrid } from '../../utils/grid'
import { placeFromCoords } from '../../utils/places'
import { temperatureColor, temperatureGradientCss } from '../../utils/temperatureColor'
import { getWeatherInfo } from '../../utils/weatherCodes'

interface Props {
  onSelect: (place: Place) => void
  /** Hours from now to display (0 = now). Driven by the time slider in Step 6. */
  hourOffset?: number
}

/**
 * The "TV forecast" layer: a grid of temperature + icon markers over the visible map.
 *
 * Flow: map moves -> (debounce 400 ms) -> build snapped grid -> fetch only
 * the points not in cache (one batched request) -> draw markers.
 */
export function GridLayer({ onSelect, hourOffset = 0 }: Props) {
  const view = useMapView()
  // Wait until the user stops panning/zooming before requesting anything.
  const settledView = useDebouncedValue(view, 400)
  const points = useMemo(() => buildGrid(settledView), [settledView])
  const { data, isFetching, isError } = useWeatherGrid(points)

  // Every point uses the same UTC time slot, so the whole map shows the same moment.
  const nowSlot = useCurrentUtcHour()
  const slot = addHoursToSlot(nowSlot, hourOffset)

  return (
    <>
      {/*
        Own pane BELOW Leaflet's overlay pane (z-index 400), so the selected-place
        and my-location dots (SVG, in the overlay pane) are always drawn on top.
      */}
      <Pane name="weather-grid" style={{ zIndex: 350 }}>
        {points.map((p) => {
          const forecast = data?.get(`${p.api.lat},${p.api.lon}`)
          if (!forecast) return null
          const i = forecast.hourly.time.indexOf(slot)
          if (i === -1) return null
          return (
            <GridMarker
              key={`${p.lat},${p.lon}`}
              lat={p.lat}
              lon={p.lon}
              temperature={forecast.hourly.temperature_2m[i]}
              weatherCode={forecast.hourly.weather_code[i]}
              isDay={forecast.hourly.is_day[i] === 1}
              onSelect={onSelect}
            />
          )
        })}
      </Pane>

      <GridStatus loading={isFetching} error={isError} />
    </>
  )
}

/** Tracks the visible bounds + pixel size, updated when a move/zoom ends. */
function useMapView(): MapView {
  const map = useMap()
  const read = useCallback((): MapView => {
    const b = map.getBounds()
    const size = map.getSize()
    return {
      south: b.getSouth(),
      west: b.getWest(),
      north: b.getNorth(),
      east: b.getEast(),
      width: size.x,
      height: size.y,
    }
  }, [map])

  const [view, setView] = useState(read)
  useMapEvents({
    moveend: () => setView(read()), // fires after both pans and zooms
    resize: () => setView(read()),
  })
  return view
}

interface MarkerProps {
  lat: number
  lon: number
  temperature: number
  weatherCode: number
  isDay: boolean
  onSelect: (place: Place) => void
}

/**
 * One grid marker. `memo` skips re-rendering markers whose values didn't change,
 * and the DivIcon (HTML string) is only rebuilt when temperature/icon change.
 */
const GridMarker = memo(function GridMarker({ lat, lon, temperature, weatherCode, isDay, onSelect }: MarkerProps) {
  const info = getWeatherInfo(weatherCode, isDay)
  const rounded = Math.round(temperature)

  const icon = useMemo(
    () =>
      L.divIcon({
        className: 'grid-marker', // replaces Leaflet's default white box styling
        iconSize: [64, 28],
        iconAnchor: [32, 14], // center of the pill sits on the coordinate
        html: `<div class="grid-pill" style="--temp-color:${temperatureColor(temperature)}">
                 <span aria-hidden="true">${info.icon}</span><span>${rounded}°</span>
               </div>`,
      }),
    [temperature, rounded, info.icon],
  )

  return (
    <Marker
      position={[lat, lon]}
      icon={icon}
      pane="weather-grid"
      title={`${info.label}, ${rounded}°C`}
      eventHandlers={{ click: () => onSelect(placeFromCoords(lat, lon)) }}
    >
      <Tooltip direction="top" offset={[0, -14]}>
        {info.label} · {rounded}°C
      </Tooltip>
    </Marker>
  )
})

/** Legend + loading/error indicator, bottom-left. pointer-events-none: clicks pass through to the map. */
function GridStatus({ loading, error }: { loading: boolean; error: boolean }) {
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] w-48 rounded-lg bg-slate-900/85 p-2 text-[11px] text-slate-300 shadow-lg backdrop-blur">
      <div className="mb-1 flex justify-between">
        <span>Temperature</span>
        {loading && <span className="text-sky-400">Updating…</span>}
        {error && !loading && <span className="text-amber-400">Map data unavailable</span>}
      </div>
      <div className="h-2 rounded-full" style={{ background: temperatureGradientCss() }} />
      <div className="mt-0.5 flex justify-between text-slate-400">
        <span>-20°</span>
        <span>0°</span>
        <span>20°</span>
        <span>40°</span>
      </div>
    </div>
  )
}
