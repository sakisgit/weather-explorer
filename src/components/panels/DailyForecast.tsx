import type { DailyWeather } from '../../api/types'
import { formatTemp, formatWeekday } from '../../utils/format'
import { getWeatherInfo } from '../../utils/weatherCodes'

/**
 * 7-day forecast. Each row has a min-max bar positioned on the WEEK's
 * overall range, so you can compare days at a glance (like weather apps do).
 */
export function DailyForecast({ daily }: { daily: DailyWeather }) {
  const weekMin = Math.min(...daily.temperature_2m_min)
  const weekMax = Math.max(...daily.temperature_2m_max)
  const range = weekMax - weekMin || 1 // avoid dividing by 0 if every day is identical

  return (
    <ul className="divide-y divide-slate-800">
      {daily.time.map((date, i) => {
        const min = daily.temperature_2m_min[i]
        const max = daily.temperature_2m_max[i]
        const info = getWeatherInfo(daily.weather_code[i])
        const rain = daily.precipitation_probability_max[i]

        return (
          <li key={date} className="grid grid-cols-[3rem_1.75rem_2.5rem_1fr_2.5rem] items-center gap-2 py-2 text-sm">
            <span className="text-slate-300">{i === 0 ? 'Today' : formatWeekday(date)}</span>
            <span title={info.label} aria-label={info.label} className="text-lg">
              {info.icon}
            </span>
            <span className="text-xs text-sky-400">{rain >= 10 ? `${rain}%` : ''}</span>
            <div className="flex items-center gap-2">
              <span className="w-8 text-right text-slate-400">{formatTemp(min)}</span>
              <div className="relative h-1.5 flex-1 rounded-full bg-slate-800">
                <div
                  className="absolute h-full rounded-full bg-gradient-to-r from-sky-400 to-amber-400"
                  style={{
                    left: `${((min - weekMin) / range) * 100}%`,
                    right: `${((weekMax - max) / range) * 100}%`,
                  }}
                />
              </div>
            </div>
            <span className="text-right text-slate-100">{formatTemp(max)}</span>
          </li>
        )
      })}
    </ul>
  )
}
