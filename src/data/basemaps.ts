/**
 * The map styles the user can pick. All are Esri tile services that need no API key
 * but require attribution. Note Esri's tile URL order is {z}/{y}/{x}, not {z}/{x}/{y}.
 */
export type BasemapId = 'dark' | 'light' | 'color'

interface Basemap {
  label: string
  url: string
  /** Tile credits; the Open-Meteo credit is added by the map. */
  attribution: string
  /** CSS background for the little preview in the switcher. */
  swatch: string
}

const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services'

export const BASEMAPS: Record<BasemapId, Basemap> = {
  // Dark and muted, so the weather data stands out (the default).
  dark: {
    label: 'Dark',
    url: `${ESRI}/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
    attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
    swatch: 'linear-gradient(135deg, #3f3f46, #18181b)',
  },
  light: {
    label: 'Light',
    url: `${ESRI}/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
    attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
    swatch: 'linear-gradient(135deg, #f4f4f5, #d4d4d8)',
  },
  // Topographic: relief, vegetation and water in natural colours.
  color: {
    label: 'Color',
    url: `${ESRI}/World_Topo_Map/MapServer/tile/{z}/{y}/{x}`,
    attribution:
      'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, FAO, NOAA, USGS, &copy; OpenStreetMap contributors, and the GIS User Community',
    swatch: 'linear-gradient(135deg, #b5d3a7, #e8dfc4 55%, #9cc3e6)',
  },
}

export const BASEMAP_IDS = Object.keys(BASEMAPS) as BasemapId[]
