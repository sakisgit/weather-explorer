import L from 'leaflet'
import { memo, useCallback, useMemo, useState } from 'react'
import { Marker, Pane, useMap, useMapEvents } from 'react-leaflet'
import { useCurrentUtcHour } from '../../hooks/useCurrentUtcHour'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useMapWeather } from '../../hooks/useMapWeather'
import type { Place } from '../../types'
import { type MapView, type VisibleCity, placeFromCity, selectVisibleCities } from '../../utils/cities'
import { temperatureColor, temperatureGradientCss } from '../../utils/temperatureColor'
import { addHoursToSlot } from '../../utils/time'
import { getWeatherInfo } from '../../utils/weatherCodes'

interface Props {
  onSelect: (place: Place) => void
  /** Hours from now to display (0 = now). Driven by the time slider in Step 6. */
  hourOffset?: number
}

/**
 * The "TV forecast" layer: city names with a weather icon and temperature.
 *
 * Flow: map moves -> (debounce 400 ms) -> pick visible cities for this zoom ->
 * fetch only the cities not in cache (one batched request) -> draw markers.
 */
export function CitiesLayer({ onSelect, hourOffset = 0 }: Props) {
  const view = useMapView()
  // Wait until the user stops panning/zooming before requesting anything.
  const settledView = useDebouncedValue(view, 400)
  const cities = useMemo(() => selectVisibleCities(settledView), [settledView])
  const points = useMemo(() => cities.map((c) => c.api), [cities])
  const { data, isFetching, isError } = useMapWeather(points)

  // All cities use the same UTC hour, so the whole map shows the same moment.
  const nowSlot = useCurrentUtcHour()
  const slot = addHoursToSlot(nowSlot, hourOffset)

  return (
    <>
      {/*
        Own pane BELOW Leaflet's overlay pane (z-index 400), so the selected-place
        and my-location dots (SVG, in the overlay pane) are always drawn on top.
      */}
      <Pane name="cities" style={{ zIndex: 350 }}>
        {cities.map((city) => {
          const forecast = data?.get(`${city.api.lat},${city.api.lon}`)
          const i = forecast ? forecast.hourly.time.indexOf(slot) : -1
          if (!forecast || i === -1) return null
          return (
            <CityMarker
              key={`${city.name}-${city.displayLon}`}
              city={city}
              temperature={forecast.hourly.temperature_2m[i]}
              weatherCode={forecast.hourly.weather_code[i]}
              isDay={forecast.hourly.is_day[i] === 1}
              onSelect={onSelect}
            />
          )
        })}
      </Pane>

      <Legend loading={isFetching} error={isError} />
    </>
  )
}

/** Tracks the visible bounds + zoom, updated when a move/zoom ends. */
function useMapView(): MapView {
  const map = useMap()
  const read = useCallback((): MapView => {
    const b = map.getBounds()
    return { south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast(), zoom: map.getZoom() }
  }, [map])

  const [view, setView] = useState(read)
  useMapEvents({
    moveend: () => setView(read()), // fires after both pans and zooms
    resize: () => setView(read()),
  })
  return view
}

interface MarkerProps {
  city: VisibleCity
  temperature: number
  weatherCode: number
  isDay: boolean
  onSelect: (place: Place) => void
}

/**
 * One city label: big icon, temperature (colored by the scale) and name. No box,
 * so the basemap stays visible. `memo` skips re-rendering markers whose values
 * didn't change, and the DivIcon is only rebuilt when the displayed values change.
 */
const CityMarker = memo(function CityMarker({ city, temperature, weatherCode, isDay, onSelect }: MarkerProps) {
  const info = getWeatherInfo(weatherCode, isDay)
  const rounded = Math.round(temperature)
  const color = temperatureColor(temperature)

  const icon = useMemo(
    () =>
      L.divIcon({
        className: 'city-marker', // replaces Leaflet's default white box styling
        iconSize: [120, 52],
        iconAnchor: [60, 18], // the icon (not the name) sits on the city's coordinate
        html: `<div class="city-label" style="--temp-color:${color}">
                 <div class="city-row"><span class="city-icon" aria-hidden="true">${info.icon}</span><span class="city-temp">${rounded}°</span></div>
                 <div class="city-name">${city.name}</div>
               </div>`,
      }),
    [color, info.icon, rounded, city.name],
  )

  return (
    <Marker
      position={[city.lat, city.displayLon]}
      icon={icon}
      pane="cities"
      title={`${city.name}: ${info.label}, ${rounded}°C`}
      eventHandlers={{ click: () => onSelect(placeFromCity(city)) }}
    />
  )
})

/** Color scale legend + loading/error status, bottom-left. pointer-events-none: clicks pass through. */
function Legend({ loading, error }: { loading: boolean; error: boolean }) {
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
