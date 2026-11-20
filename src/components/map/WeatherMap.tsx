import { useEffect } from 'react'
import { CircleMarker, MapContainer, TileLayer, Tooltip, ZoomControl, useMap, useMapEvents } from 'react-leaflet'
import type { LatLon } from '../../api/types'
import type { Place } from '../../types'
import { usePlacesStore } from '../../store/usePlacesStore'
import { placeFromCoords } from '../../utils/places'
import { CitiesLayer } from './CitiesLayer'

interface Props {
  selected: Place | null
  /** The user's own position (from geolocation), shown with its own marker. */
  myLocation: LatLon | null
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
export function WeatherMap({ selected, myLocation, onSelect }: Props) {
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
        // Open-Meteo data is CC BY 4.0, which requires visible attribution in the app.
        attribution='Weather data by <a href="https://open-meteo.com/">Open-Meteo.com</a> | Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors'
        maxZoom={16}
      />
      <ZoomControl position="bottomright" />

      <CitiesLayer onSelect={onSelect} />
      <MapClickHandler onSelect={onSelect} />
      <SavedPlacesMarkers onSelect={onSelect} />
      <FlyToSelected selected={selected} />

      {/*
        CircleMarker is drawn as SVG, so it avoids Leaflet's well-known
        "missing default marker icon" problem with bundlers like Vite.
      */}
      {/* The user's position stays visible even after selecting other places. */}
      {myLocation && (
        <CircleMarker
          center={[myLocation.lat, myLocation.lon]}
          radius={6}
          pathOptions={{ color: '#fff', weight: 2, fillColor: '#22c55e', fillOpacity: 1 }}
          // Don't let the click also reach the map (which would select raw coordinates)
          bubblingMouseEvents={false}
          eventHandlers={{ click: () => onSelect(placeFromCoords(myLocation.lat, myLocation.lon, 'My location')) }}
        >
          <Tooltip direction="top" offset={[0, -6]}>
            You are here
          </Tooltip>
        </CircleMarker>
      )}

      {selected && (
        <CircleMarker
          center={[selected.lat, selected.lon]}
          radius={9}
          pathOptions={{ color: '#fff', weight: 2, fillColor: '#0ea5e9', fillOpacity: 1 }}
          bubblingMouseEvents={false}
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

/** A small amber dot for every saved place, so the collection is visible on the map. */
function SavedPlacesMarkers({ onSelect }: { onSelect: (place: Place) => void }) {
  const places = usePlacesStore((s) => s.places)

  return places.map((place) => (
    <CircleMarker
      key={place.id}
      center={[place.lat, place.lon]}
      radius={5}
      pathOptions={{ color: '#0f172a', weight: 1.5, fillColor: '#f59e0b', fillOpacity: 1 }}
      bubblingMouseEvents={false}
      eventHandlers={{ click: () => onSelect(place) }}
    >
      <Tooltip direction="top" offset={[0, -5]}>
        ★ {place.name}
      </Tooltip>
    </CircleMarker>
  ))
}
