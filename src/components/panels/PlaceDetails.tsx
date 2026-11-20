import { useForecast } from '../../hooks/useForecast'
import type { Place } from '../../types'
import { degreesToCompass, formatHour, formatTemp, toHourSlot } from '../../utils/format'
import { getWeatherInfo } from '../../utils/weatherCodes'
import { DailyForecast } from './DailyForecast'
import { ForecastChart } from './ForecastChart'

/**
 * "Dive into a place": current conditions, next 48 h chart and 7-day forecast.
 * All three come from ONE request (useForecast), cached by rounded coordinates.
 */
export function PlaceDetails({ place }: { place: Place }) {
  const { data, isPending, isError, error, refetch } = useForecast(place)

  return (
    <article className="space-y-5">
      <header>
        <h2 className="text-xl font-semibold text-slate-100">{place.name}</h2>
        {place.subtitle && <p className="text-sm text-slate-400">{place.subtitle}</p>}
      </header>

      {isPending && <DetailsSkeleton />}

      {isError && (
        <div role="alert" className="rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">
          <p>Could not load the forecast: {error.message}</p>
          <button onClick={() => refetch()} className="mt-2 underline hover:text-red-200">
            Try again
          </button>
        </div>
      )}

      {data && <DetailsContent data={data} />}
    </article>
  )
}

function DetailsContent({ data }: { data: NonNullable<ReturnType<typeof useForecast>['data']> }) {
  const { current, hourly, daily } = data
  const info = getWeatherInfo(current.weather_code, current.is_day === 1)

  // The hourly arrays start at local midnight today; find the slot for "now" at that place.
  const nowIndex = Math.max(0, hourly.time.indexOf(toHourSlot(current.time)))

  return (
    <>
      <section aria-label="Current conditions" className="rounded-xl bg-slate-800/60 p-4">
        <div className="flex items-center gap-4">
          <span className="text-5xl" aria-hidden>
            {info.icon}
          </span>
          <div>
            <div className="text-4xl font-light text-slate-100">{formatTemp(current.temperature_2m)}C</div>
            <div className="text-sm text-slate-300">{info.label}</div>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <Stat label="Feels like" value={formatTemp(current.apparent_temperature)} />
          <Stat label="Humidity" value={`${current.relative_humidity_2m}%`} />
          <Stat
            label="Wind"
            value={`${Math.round(current.wind_speed_10m)} km/h ${degreesToCompass(current.wind_direction_10m)}`}
          />
        </dl>
        <p className="mt-3 text-xs text-slate-500">Local time {formatHour(current.time)}</p>
      </section>

      <section aria-labelledby="hourly-title">
        <h3 id="hourly-title" className="mb-2 text-sm font-medium text-slate-300">
          Next 48 hours
        </h3>
        <ForecastChart hourly={hourly} startIndex={nowIndex} />
      </section>

      <section aria-labelledby="daily-title">
        <h3 id="daily-title" className="mb-1 text-sm font-medium text-slate-300">
          7-day forecast
        </h3>
        <DailyForecast daily={daily} />
      </section>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-900/60 p-2">
      <dt className="text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-100">{value}</dd>
    </div>
  )
}

/** Grey placeholder blocks with the same shape as the content, so the layout doesn't jump. */
function DetailsSkeleton() {
  return (
    <div className="animate-pulse space-y-5" aria-busy="true" aria-label="Loading forecast">
      <div className="h-36 rounded-xl bg-slate-800" />
      <div className="h-52 rounded-xl bg-slate-800" />
      <div className="space-y-2">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="h-7 rounded bg-slate-800" />
        ))}
      </div>
    </div>
  )
}
