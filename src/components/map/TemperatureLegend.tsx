import L from 'leaflet'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMap } from 'react-leaflet'
import { temperatureGradientCss } from '../../utils/temperatureColor'

const LABELS = ['40°', '20°', '0°', '-20°']

/**
 * The temperature color scale, as a small vertical bar above the zoom buttons.
 *
 * It is a real Leaflet control (bottom-right corner), so Leaflet stacks it above
 * the zoom buttons and the attribution by itself, whatever their height.
 * The control only provides the DOM element; React renders into it with a portal.
 * Hidden on phones, where the map is small and the colors speak for themselves.
 */
export function TemperatureLegend() {
  const map = useMap()
  // The element Leaflet places in its corner. `data-map-obstacle`: no city labels under it.
  const [container] = useState(() => {
    const el = L.DomUtil.create('div', 'leaflet-control hidden sm:block')
    el.setAttribute('data-map-obstacle', '')
    return el
  })

  useEffect(() => {
    const Control = L.Control.extend({ onAdd: () => container })
    const control = new Control({ position: 'bottomright' }).addTo(map)
    L.DomEvent.disableClickPropagation(container)
    return () => {
      control.remove()
    }
  }, [map, container])

  return createPortal(
    <div
      role="img"
      aria-label="Temperature color scale, from -20 °C (purple) to 40 °C (red)"
      className="flex gap-1.5 rounded-lg bg-slate-900/90 px-2 py-2 shadow-lg backdrop-blur"
    >
      <div className="flex flex-col justify-between text-right text-[10px] leading-none text-slate-400">
        {LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="h-28 w-2 rounded-full" style={{ background: temperatureGradientCss('to top') }} />
    </div>,
    container,
  )
}
