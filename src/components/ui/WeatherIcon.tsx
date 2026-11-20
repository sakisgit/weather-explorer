import { type WeatherIconName, weatherIconUrl } from '../../utils/weatherCodes'

interface Props {
  name: WeatherIconName
  /** Text for screen readers / hover. Leave empty when the label is already shown next to the icon. */
  label?: string
  animated?: boolean
  className?: string
}

/**
 * A Meteocons weather icon. A plain <img>: the SVG's own animation plays inside it,
 * and its internal ids (gradients) can't clash with other icons on the page.
 */
export function WeatherIcon({ name, label = '', animated = true, className }: Props) {
  return (
    <img
      src={weatherIconUrl(name, animated)}
      alt={label}
      title={label || undefined}
      className={className}
      draggable={false}
      loading="lazy"
    />
  )
}
