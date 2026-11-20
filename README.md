# Weather Explorer

Explore the weather anywhere in the world on an interactive map, dive into the places that interest you, build your own collection of places and compare them side by side.

**Live demo:** https://weather-explorer-smoky.vercel.app

Built with React, TypeScript, Leaflet and the [Open-Meteo](https://open-meteo.com/) Forecast and Geocoding APIs. **No API keys are required.**

## Features

- **TV-forecast-style map overview.** Cities with a weather icon and a temperature colored on a scale. More cities appear as you zoom in, and labels never overlap.
- **Timeline with play.** A timeline at the bottom of the map, with the days marked on it. Scrub through the next 48 hours, or press play to watch the weather move across the map once (it stops at +48 h; press again to replay). The temperature color scale sits separately above the zoom buttons.
- **Place details.** Current conditions (feels like, humidity, wind), a 48-hour temperature and rain chart, and a 7-day forecast. The chart line is colored with the same temperature scale as the map, the high and low are marked, midnight is shown as a dashed day line, and hovering shows a crosshair with a tooltip.
- **Search.** Debounced place search with keyboard navigation (↑ ↓ Enter Esc). The map flies to the selected place.
- **Click anywhere on the map** to get the forecast for that point.
- **Current location.** A "My location" button. Returning users who already granted permission are located automatically.
- **My places.** Save up to 12 places (persisted in `localStorage`) and compare them: current weather, today's high/low and rain chance, sorting by temperature, and a 7-day high-temperature chart.
- **Map styles.** Switch the basemap between Dark (the default, so the weather stands out), Light and Color (topographic). On the lighter maps every city label gets a dark card so it stays readable.
- **Collapsible panel.** An arrow collapses the side panel (or the bottom panel on phones) to give the map the whole screen. Picking a place opens it again. The panel state and the map style are remembered between visits.
- Responsive layout: map and side panel on desktop, map above the panel on mobile. On a phone the map controls get more compact, and a selected place is centred in the part of the map not covered by the search box or the time slider.

## 1. Installation and setup

Requirements: **Node.js 20.19+ or 22.12+** (required by Vite 8) and npm.

```bash
git clone https://github.com/sakisgit/weather-explorer.git
cd weather-explorer
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build locally
npm run lint       # oxlint
```

No `.env` file or API keys are needed. Open-Meteo is free for non-commercial use, and the basemap tiles need no key either.

**Deploy:** the app is a static SPA. On Vercel, import the repository; it auto-detects Vite (build `npm run build`, output `dist`), and no environment variables are required. Geolocation needs HTTPS, which Vercel provides.

## 2. Implementation choices

### Stack

| Concern | Choice | Why |
|---|---|---|
| UI | **React 19 + TypeScript** | My main stack, so I could focus on the problem rather than on the tooling. |
| Build | **Vite** (SPA) | Everything runs in the browser (map, geolocation, `localStorage`), so a server framework adds nothing. Calling Open-Meteo directly from the browser also means each user has their **own** per-IP rate limit, instead of every user sharing one server IP. |
| Server state | **TanStack Query** | Caching, request de-duplication, cancellation and retries are the core of being mindful of rate limits. |
| Client state | **Zustand** with `persist` | Saved places are read by unrelated components (panel, save button, map markers) and must survive reloads. |
| Map | **Leaflet + react-leaflet** | Lightweight, mature, no key needed. |
| Charts | **Chart.js + react-chartjs-2** | Tree-shakeable; mixed line and bar charts with two y-axes. |
| Styling | **Tailwind CSS v4** | Fast to iterate, consistent design tokens. |
| Icons | **Meteocons** (weather) + **lucide-react** (UI) | Colored, animated weather icons that read like a weather app; one consistent, tree-shakeable set for the buttons. |

I chose React because it is what I know best. The role mentions Vue/Nuxt as a plus, and I am keen to learn them. The architecture (API layer, data hooks, stores, presentational components) maps directly onto Vue composables and Pinia.

### Project structure

```
src/
  api/          typed fetch functions (openMeteo.ts, geocoding.ts), HTTP error handling
  hooks/        data hooks (useForecast, useMapWeather, useGeocodingSearch, useGeolocation, ...)
  store/        Zustand store for saved places
  components/
    map/        WeatherMap, CitiesLayer (overview + time slider)
    panels/     PlaceDetails, ForecastChart, DailyForecast, SavedPlaces, CompareChart
    ui/         SearchBox, LocateButton, SaveButton, TimeSlider
  data/         static list of cities for the map overview
  utils/        weather codes, formatting, time zones, city selection, color scale
```

Components never build URLs. They call hooks, the hooks call the API layer, and the API layer is the only place that knows about Open-Meteo.

### Being mindful of the API rate limits

Open-Meteo's free tier allows roughly 600 calls per minute and 10,000 per day **per IP**. A multi-location request counts as one call per location, and a request with more than 10 variables counts as more than one. The app is designed around these limits:

1. **Caching.** Data is considered fresh for 15 minutes (Open-Meteo models update about hourly). Revisiting a place, switching tabs or re-opening a saved place costs no request. Place search results are cached for a day.
2. **Rounded coordinates in cache keys.** Coordinates are rounded to 2 decimals (about 1 km, finer than the weather models' resolution), so nearby clicks reuse the same cache entry. This also means the user's exact position is never sent to the API.
3. **Batching.** Open-Meteo accepts comma-separated coordinates. All cities on the map load in **one** request, and all saved places for the comparison load in **one** request.
4. **Per-point caching on the map.** Each city's forecast is cached under its own key. When the map moves, only the cities that are not already cached are requested, in a single batch. Panning so that three new cities appear costs three locations, not the whole screen.
5. **Debouncing.** Search waits 300 ms after the last keystroke (and needs at least 2 characters). Map updates wait 400 ms after panning or zooming stops.
6. **Hard caps.** At most 40 cities per view and at most 12 saved places.
7. **Few variables.** Map requests use 3 variables and compare requests use 7, so they stay under the 10-variable threshold.
8. **The time slider makes zero requests.** Each city already has 72 hourly values in UTC, so scrubbing or playing only changes which hour is displayed.
9. **Sensible retries and a time limit.** Every request gives up after 10 seconds (`AbortSignal.timeout`, combined with TanStack Query's own cancellation through `AbortSignal.any`), so a hanging connection never leaves a spinner forever. Network errors, timeouts and 5xx responses are retried up to 2 times. 4xx responses, including **429 Too Many Requests**, are never retried. Requests whose results are no longer needed (for example when the user keeps typing) are aborted.

### Other decisions

- **Cities instead of a regular grid.** My first version drew a regular grid of points. It looked mechanical, hid the basemap and showed nameless points in the sea, so I replaced it with a curated list of about 190 cities in three importance tiers. Visible cities are picked by zoom level, and a collision check in screen pixels (Web Mercator, `L.CRS.EPSG3857`) makes sure the more important city wins when labels would overlap. Labels are also kept out from under the floating UI (search box, time slider): those elements are marked with `data-map-obstacle`, and their screen rectangles are read from the DOM, so this keeps working when the layout changes on mobile. Cities that would be hidden are not requested either. A static list costs no requests and gives the map real names.
- **Time zones.** Place details use `timezone=auto`, so times are local to the place (Tokyo shows Tokyo time). Times are read from the string instead of `new Date()`, so they are not shifted into the viewer's time zone. The map overview uses UTC, so all cities share one clock and the slider shows the same moment everywhere; its label is shown in the viewer's own time zone.
- **Map controls follow the map's width, not the screen's.** The map area is a CSS container, and the floating controls use container queries (Tailwind `@lg:`, `@2xl:`). On a tablet with the side panel open the screen is wide but the map is narrow, and media queries made the search bar overflow it.
- **Tested across browsers and screens.** With Playwright on Chromium (Chrome, Edge, Android), WebKit (Safari on iPhone, iPad and Mac) and Firefox, at 17 sizes from an iPhone SE to a 2560px monitor: no horizontal scroll, no overlapping controls, no city labels under the controls, no console errors.
- **Weather icons as static files.** The Meteocons SVGs live in `public/weather-icons/`, so the browser downloads only the ones on screen and caches them, and they add nothing to the JavaScript bundle. The panel uses the animated versions; the map uses static ones, because 50+ icons moving at once would distract and cost CPU.
- **Lazy-loaded charts.** Chart.js was about a third of the bundle but is only needed once a place is opened. Both chart components are loaded with `React.lazy` + `Suspense` (with a placeholder of the same height, so the layout doesn't jump), which takes the initial JavaScript from 202 kB to 139 kB gzipped and removes Vite's large-chunk warning.
- **Geolocation.** The app never shows the permission prompt on page load, because unprompted requests tend to get denied permanently. It uses the Permissions API to locate automatically only if permission was already granted; otherwise it waits for a click. Errors (denied, unavailable, timeout) show friendly messages with alternatives.
- **Basemap.** Esri "World Dark Gray" tiles: no API key, and a muted dark style that lets the weather data stand out. CARTO dark tiles were my first choice, but they now require an API key, and a key in a public, client-side app would be visible to everyone.
- **Accessibility.** The search box follows the ARIA combobox pattern, the tabs use `tablist`/`tab` roles, the time slider is a native range input with `aria-valuetext`, the save button uses `aria-pressed`, and loading and error states are announced.

## 3. Incomplete requirements and known limitations

All the requirements in the brief are implemented. Known limitations:

- **No reverse geocoding.** Open-Meteo has no coordinates-to-name API, so a point clicked on the map is named by its coordinates (e.g. `40.64°N, 22.94°E`). Cities on the map, search results and "My location" do have names.
- **The map overview uses a fixed list of cities.** It covers the world, with more detail in Europe and Greece, but zooming into a sparse region shows few labels. Any point can still be clicked.
- **No automated tests.** Correctness was checked by type-checking, linting, manual testing and checks against live API responses.
- **Celsius only.** There is no °C/°F toggle yet.
- In the compare chart, day labels come from the first place's dates, so places in very different time zones may be offset by a day.

## 4. Next steps

- **Tests.** Unit tests (Vitest) for the pure logic: city selection and collision detection, time-slot helpers, color scale, coordinate rounding. Component tests for search and saving. One Playwright end-to-end test of the main flow.
- **More map layers.** An interpolated temperature or precipitation overlay (canvas heatmap), and switching the map between temperature, rain and wind.
- °C/°F and km/h/mph toggles, persisted with the saved places.
- Shareable URLs: put the selected place and the time slider position in the URL.
- Renaming saved places (useful for points clicked on the map) and reordering them with drag and drop.
- Validate API responses at runtime (e.g. with Zod). Today the response types are only a promise to TypeScript.
- A PWA/offline cache for saved places.
- Port it to **Vue 3 / Nuxt**, as a way to learn the stack AgroApps uses.

## 5. Additional notes

- **How I used AI tools.** I built this with an AI coding assistant (Claude Code), working step by step: for each step I discussed the approach, reviewed the generated code, asked why things were done a certain way, tested the result in the browser and asked for changes. Some examples visible in the commit history:
  - I rejected the first map overview (boxed grid markers) and chose the city-based design.
  - A lint warning revealed a suppressed `useEffect` dependency issue. It was fixed properly instead of being silenced.
  - Testing in the browser revealed a hover text that did not follow the time slider (react-leaflet only reads a marker's `title` on creation).
  - An index-based match between saved places and API results could show the wrong weather after a removal. It now matches by coordinates.
- **Commit history.** Each step of the build is a separate commit with a description of what changed and why.
- **Credits.** Weather data by [Open-Meteo.com](https://open-meteo.com/) (CC BY 4.0). Basemap © Esri, HERE, Garmin, © OpenStreetMap contributors. Attribution is shown on the map. Weather icons: [Meteocons](https://github.com/basmilius/weather-icons) by Bas Milius (MIT, license in `public/weather-icons/`). UI icons: [Lucide](https://lucide.dev) (ISC).
