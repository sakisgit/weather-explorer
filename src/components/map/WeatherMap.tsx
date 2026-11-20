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
      {/*
        Esri "Dark Gray Canvas" basemap: no API key needed (CARTO now requires one),
        attribution required. A dark, muted basemap lets the weather data stand out.
        Note Esri's tile URL order is {z}/{y}/{x}, not the usual {z}/{x}/{y}.
      */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors"
        maxZoom={16}
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
  // Depend on the coordinates (plain numbers), not the object: a new object
  // for the same place must not trigger another fly animation.
  const lat = selected?.lat
  const lon = selected?.lon

  useEffect(() => {
    if (lat === undefined || lon === undefined) return
    // Never zoom OUT when flying (e.g. clicking the map while zoomed in).
    const zoom = Math.max(map.getZoom(), 8)
    map.flyTo([lat, lon], zoom, { duration: 1.2 })
  }, [map, lat, lon])

  return null
}
