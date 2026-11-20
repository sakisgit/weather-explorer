import { useEffect } from 'react'
import { CircleMarker, MapContainer, TileLayer, Tooltip, ZoomControl, useMap, useMapEvents } from 'react-leaflet'
import type { Place } from '../../types'
import { placeFromCoords } from '../../utils/places'

interface Props {
  selected: Place | null
  onSelect: (place: Place) => void
}

const INITIAL_CENTER: [number, number] = [38, 15] // Mediterranean / Europe
const INITIAL_ZOOM = 4

/**
 * The map "stage".
 *
 * react-leaflet wraps Leaflet's imperative API in components. Things Leaflet
 * doesn't expose as props (flyTo, click events) are done in small child
 * components that use the `useMap` / `useMapEvents` hooks. Those hooks only
 * work INSIDE <MapContainer>, which is why they're separate components below.
 */
export function WeatherMap({ selected, onSelect }: Props) {
  return (
    <MapContainer
      center={INITIAL_CENTER}
      zoom={INITIAL_ZOOM}
      minZoom={2}
      worldCopyJump // panning past the date line wraps smoothly instead of showing an empty world
      zoomControl={false} // re-added bottom-right so it doesn't collide with the search box
      className="h-full w-full"
    >
      {/* CARTO dark basemap: free, no API key, needs attribution. Dark fits the TV-forecast look. */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />
      <ZoomControl position="bottomright" />

      <MapClickHandler onSelect={onSelect} />
      <FlyToSelected selected={selected} />

      {/*
        CircleMarker is drawn as SVG, so it avoids Leaflet's well-known
        "missing default marker icon" problem with bundlers like Vite.
      */}
      {selected && (
        <CircleMarker
          center={[selected.lat, selected.lon]}
          radius={9}
          pathOptions={{ color: '#fff', weight: 2, fillColor: '#0ea5e9', fillOpacity: 1 }}
        >
          <Tooltip direction="top" offset={[0, -8]}>
            {selected.name}
          </Tooltip>
        </CircleMarker>
      )}
    </MapContainer>
  )
}

/** Clicking anywhere on the map selects that point. */
function MapClickHandler({ onSelect }: { onSelect: (place: Place) => void }) {
  useMapEvents({
    click(e) {
      onSelect(placeFromCoords(e.latlng.lat, e.latlng.lng))
    },
  })
  return null
}

/** Animates the map to the selected place whenever it changes. */
function FlyToSelected({ selected }: { selected: Place | null }) {
  const map = useMap()

  useEffect(() => {
    if (!selected) return
    // Never zoom OUT when flying (e.g. clicking the map while zoomed in).
    const zoom = Math.max(map.getZoom(), 8)
    map.flyTo([selected.lat, selected.lon], zoom, { duration: 1.2 })
    // Depend on the id, not the object: a new object for the same place shouldn't re-fly.
  }, [map, selected?.id])

  return null
}
