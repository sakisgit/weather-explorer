import { useState } from 'react'
import { useForecast } from '../hooks/useForecast'
import { useGeocodingSearch } from '../hooks/useGeocodingSearch'
import { getWeatherInfo } from '../utils/weatherCodes'

/**
 * TEMPORARY: proves the API layer works end to end.
 * Gets replaced by the real search box + details panel in Steps 2-3.
 */
export function ApiDemo() {
  const [query, setQuery] = useState('')
  const search = useGeocodingSearch(query)
  const athens = useForecast({ lat: 37.9838, lon: 23.7275 })

  const current = athens.data?.current
  const info = current ? getWeatherInfo(current.weather_code, current.is_day === 1) : null

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-slate-800 p-3">
        <div className="text-slate-400">Athens right now</div>
        {athens.isPending && <div>Loading…</div>}
        {athens.isError && <div className="text-red-400">{athens.error.message}</div>}
        {current && info && (
          <div className="text-2xl text-slate-100">
            {info.icon} {Math.round(current.temperature_2m)}°C · {info.label}
          </div>
        )}
      </div>

      <div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try a search…"
          className="w-full rounded-md bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-sky-500"
        />
        {search.isFetching && <div className="mt-1 text-xs">Searching…</div>}
        <ul className="mt-2 space-y-1">
          {search.enabled &&
            search.data?.map((p) => (
              <li key={p.id} className="text-slate-300">
                {p.name}, {p.admin1 ? `${p.admin1}, ` : ''}
                {p.country} ({p.latitude.toFixed(2)}, {p.longitude.toFixed(2)})
              </li>
            ))}
        </ul>
      </div>
    </div>
  )
}
