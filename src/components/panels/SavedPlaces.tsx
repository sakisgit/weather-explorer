import { useMemo, useState } from 'react'
import type { CompareResponse } from '../../api/types'
import { compareKey, useCompareForecast } from '../../hooks/useForecast'
import { usePlacesStore } from '../../store/usePlacesStore'
import type { Place } from '../../types'
import { formatTemp } from '../../utils/format'
import { temperatureColor } from '../../utils/temperatureColor'
import { getWeatherInfo } from '../../utils/weatherCodes'
import { CompareChart } from './CompareChart'

type SortBy = 'saved' | 'warmest' | 'coldest'

interface Props {
  onSelect: (place: Place) => void
}

/**
 * "My places": the user's collection, compared side by side.
 * All saved places are loaded with ONE batched request (useCompareForecast).
 */
export function SavedPlaces({ onSelect }: Props) {
  const places = usePlacesStore((s) => s.places)
  const removePlace = usePlacesStore((s) => s.removePlace)
  const { data, isPending, isError, refetch } = useCompareForecast(places)
  const [sortBy, setSortBy] = useState<SortBy>('saved')

  // Pair each place with its forecast (looked up by coordinates), then sort.
  const rows = useMemo(() => {
    const paired = places.map((place) => ({ place, forecast: data?.get(compareKey(place)) }))
    if (sortBy === 'saved') return paired
    const temp = (r: (typeof paired)[number]) => r.forecast?.current.temperature_2m ?? 0
    return [...paired].sort((a, b) => (sortBy === 'warmest' ? temp(b) - temp(a) : temp(a) - temp(b)))
  }, [places, data, sortBy])

  // The chart only uses places whose data has arrived (always in saved order, so colors stay stable).
  const chartRows = useMemo(
    () =>
      places.flatMap((place) => {
        const forecast = data?.get(compareKey(place))
        return forecast ? [{ place, forecast }] : []
      }),
    [places, data],
  )

  if (places.length === 0) {
    return (
      <div className="space-y-2 text-sm text-slate-400">
        <p className="text-base text-slate-200">No saved places yet</p>
        <p>
          Open any place and press <span className="text-amber-300">☆ Save</span> to build your own collection. Saved
          places are compared side by side here and marked with a star on the map.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-100">My places ({places.length})</h2>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          Sort
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-slate-200"
          >
            <option value="saved">Saved order</option>
            <option value="warmest">Warmest now</option>
            <option value="coldest">Coldest now</option>
          </select>
        </label>
      </div>

      {isError && (
        <div role="alert" className="rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">
          Could not load the comparison.{' '}
          <button onClick={() => refetch()} className="underline">
            Try again
          </button>
        </div>
      )}

      <ul className="space-y-2">
        {rows.map(({ place, forecast }) => (
          <li key={place.id} className="group flex items-center gap-2 rounded-lg bg-slate-800/60 hover:bg-slate-800">
            <button
              onClick={() => onSelect(place)}
              className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left"
              aria-label={`Show details for ${place.name}`}
            >
              {forecast ? <PlaceSummary place={place} forecast={forecast} /> : <RowSkeleton name={place.name} loading={isPending} />}
            </button>
            <button
              onClick={() => removePlace(place.id)}
              aria-label={`Remove ${place.name}`}
              className="mr-2 rounded p-1.5 text-slate-500 hover:bg-slate-700 hover:text-slate-200"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {chartRows.length >= 2 && (
        <section aria-labelledby="compare-title">
          <h3 id="compare-title" className="mb-2 text-sm font-medium text-slate-300">
            Daily high, next 7 days
          </h3>
          <CompareChart rows={chartRows} />
        </section>
      )}
    </div>
  )
}

function PlaceSummary({ place, forecast }: { place: Place; forecast: CompareResponse }) {
  const { current, daily } = forecast
  const info = getWeatherInfo(current.weather_code, current.is_day === 1)

  return (
    <>
      <span className="text-2xl" title={info.label} aria-hidden>
        {info.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-slate-100">{place.name}</div>
        <div className="truncate text-xs text-slate-400">
          {info.label} · H {formatTemp(daily.temperature_2m_max[0])} L {formatTemp(daily.temperature_2m_min[0])}
          {daily.precipitation_probability_max[0] >= 10 && (
            <span className="text-sky-400"> · {daily.precipitation_probability_max[0]}% rain</span>
          )}
        </div>
      </div>
      <span className="text-xl font-semibold" style={{ color: temperatureColor(current.temperature_2m) }}>
        {formatTemp(current.temperature_2m)}
      </span>
    </>
  )
}

function RowSkeleton({ name, loading }: { name: string; loading: boolean }) {
  return (
    <>
      <span className={`h-7 w-7 rounded-full bg-slate-700 ${loading ? 'animate-pulse' : ''}`} />
      <div className="flex-1 truncate text-sm text-slate-100">{name}</div>
    </>
  )
}
