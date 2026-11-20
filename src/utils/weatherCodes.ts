/**
 * WMO weather interpretation codes -> label + icon.
 * Open-Meteo returns a numeric `weather_code`; the table is in the Open-Meteo docs.
 *
 * Icons are Meteocons by Bas Milius (MIT), colored SVGs in public/weather-icons/.
 * Each one has an animated version (panel) and a static one (map, where 50+ icons
 * animating at once would only distract and cost CPU).
 */
export type WeatherIconName =
  | 'clear-day'
  | 'clear-night'
  | 'partly-cloudy-day'
  | 'partly-cloudy-night'
  | 'overcast'
  | 'fog-day'
  | 'fog-night'
  | 'partly-cloudy-day-drizzle'
  | 'partly-cloudy-night-drizzle'
  | 'drizzle'
  | 'sleet'
  | 'partly-cloudy-day-rain'
  | 'partly-cloudy-night-rain'
  | 'rain'
  | 'partly-cloudy-day-snow'
  | 'partly-cloudy-night-snow'
  | 'snow'
  | 'thunderstorms-day'
  | 'thunderstorms-night'
  | 'thunderstorms-day-rain'
  | 'thunderstorms-night-rain'
  | 'hail'
  | 'not-available'

interface WeatherInfo {
  label: string
  icon: WeatherIconName
  nightIcon?: WeatherIconName
}

const WEATHER_CODES: Record<number, WeatherInfo> = {
  0: { label: 'Clear sky', icon: 'clear-day', nightIcon: 'clear-night' },
  1: { label: 'Mainly clear', icon: 'partly-cloudy-day', nightIcon: 'partly-cloudy-night' },
  2: { label: 'Partly cloudy', icon: 'partly-cloudy-day', nightIcon: 'partly-cloudy-night' },
  3: { label: 'Overcast', icon: 'overcast' },
  45: { label: 'Fog', icon: 'fog-day', nightIcon: 'fog-night' },
  48: { label: 'Rime fog', icon: 'fog-day', nightIcon: 'fog-night' },
  51: { label: 'Light drizzle', icon: 'partly-cloudy-day-drizzle', nightIcon: 'partly-cloudy-night-drizzle' },
  53: { label: 'Drizzle', icon: 'drizzle' },
  55: { label: 'Dense drizzle', icon: 'drizzle' },
  56: { label: 'Freezing drizzle', icon: 'sleet' },
  57: { label: 'Dense freezing drizzle', icon: 'sleet' },
  61: { label: 'Light rain', icon: 'partly-cloudy-day-rain', nightIcon: 'partly-cloudy-night-rain' },
  63: { label: 'Rain', icon: 'rain' },
  65: { label: 'Heavy rain', icon: 'rain' },
  66: { label: 'Freezing rain', icon: 'sleet' },
  67: { label: 'Heavy freezing rain', icon: 'sleet' },
  71: { label: 'Light snow', icon: 'partly-cloudy-day-snow', nightIcon: 'partly-cloudy-night-snow' },
  73: { label: 'Snow', icon: 'snow' },
  75: { label: 'Heavy snow', icon: 'snow' },
  77: { label: 'Snow grains', icon: 'snow' },
  80: { label: 'Light showers', icon: 'partly-cloudy-day-rain', nightIcon: 'partly-cloudy-night-rain' },
  81: { label: 'Showers', icon: 'rain' },
  82: { label: 'Violent showers', icon: 'rain' },
  85: { label: 'Snow showers', icon: 'partly-cloudy-day-snow', nightIcon: 'partly-cloudy-night-snow' },
  86: { label: 'Heavy snow showers', icon: 'snow' },
  95: { label: 'Thunderstorm', icon: 'thunderstorms-day', nightIcon: 'thunderstorms-night' },
  96: { label: 'Thunderstorm with hail', icon: 'thunderstorms-day-rain', nightIcon: 'thunderstorms-night-rain' },
  99: { label: 'Severe thunderstorm with hail', icon: 'hail' },
}

const UNKNOWN: WeatherInfo = { label: 'Unknown', icon: 'not-available' }

export function getWeatherInfo(code: number, isDay = true): { label: string; icon: WeatherIconName } {
  const info = WEATHER_CODES[code] ?? UNKNOWN
  return { label: info.label, icon: !isDay && info.nightIcon ? info.nightIcon : info.icon }
}

/** URL of an icon file. The files are in public/, so the browser loads (and caches) only the ones shown. */
export function weatherIconUrl(name: WeatherIconName, animated = true): string {
  return `/weather-icons/${animated ? '' : 'static/'}${name}.svg`
}
