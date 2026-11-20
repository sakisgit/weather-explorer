import {
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  type ChartData,
  type ChartOptions,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  type Plugin,
  PointElement,
  type ScriptableContext,
  Tooltip,
} from 'chart.js'
import { useMemo } from 'react'
import { Chart } from 'react-chartjs-2'
import type { HourlyWeather } from '../../api/types'
import { formatHour, formatWeekday } from '../../utils/format'
import { TEMPERATURE_STOPS, temperatureColor, temperatureGradientCss } from '../../utils/temperatureColor'
import { GRID_COLOR, TICK_COLOR, crosshairPlugin, tooltipTheme } from './chartTheme'

/*
 * Chart.js is tree-shakeable: we register only the pieces we use
 * (line + bar, two linear axes, fill, tooltip) instead of the whole library.
 */
ChartJS.register(
  LineController,
  LineElement,
  PointElement,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
)

interface Props {
  hourly: HourlyWeather
  /** Index of the current hour in the hourly arrays. */
  startIndex: number
  hours?: number
}

type Mixed = 'bar' | 'line'

/**
 * Next 48 hours: temperature as a line (left axis) and chance of rain as bars
 * (right axis, 0-100%). Two series with different units = two y axes.
 *
 * Styling, so it reads like a weather app and not a default chart:
 * - the line is colored by temperature, with the same scale as the map, and fades into a soft fill;
 * - the day's highest and lowest points are marked with their value;
 * - midnight gets a dashed line and the weekday name, so the two days are easy to tell apart;
 * - hovering shows a crosshair and a dark tooltip card.
 */
export function ForecastChart({ hourly, startIndex, hours = 48 }: Props) {
  const end = startIndex + hours

  // Only rebuild the chart data when the forecast actually changes.
  const data = useMemo<ChartData<Mixed, number[], string>>(
    () => ({
      // Full local times ("2026-11-20T14:00"): the ticks, the tooltip and the
      // midnight lines all format them as needed.
      labels: hourly.time.slice(startIndex, end),
      datasets: [
        {
          type: 'line',
          label: 'Temperature',
          data: hourly.temperature_2m.slice(startIndex, end),
          borderColor: temperatureStroke,
          backgroundColor: temperatureFill,
          borderWidth: 2.5,
          fill: 'start',
          tension: 0.4,
          // Points only on the highest and lowest hour; the others appear on hover.
          pointRadius: extremePointRadius,
          pointHoverRadius: 5,
          pointBackgroundColor: (ctx) => temperatureColor(Number(ctx.raw)),
          pointBorderColor: '#0f172a',
          pointBorderWidth: 2,
          yAxisID: 'temp',
          order: 1, // drawn on top of the bars
        },
        {
          type: 'bar',
          label: 'Chance of rain',
          data: hourly.precipitation_probability.slice(startIndex, end),
          backgroundColor: 'rgba(56, 189, 248, 0.45)',
          hoverBackgroundColor: 'rgba(56, 189, 248, 0.75)',
          borderRadius: 3,
          barPercentage: 0.75,
          categoryPercentage: 1,
          yAxisID: 'rain',
          order: 2,
        },
      ],
    }),
    [hourly, startIndex, end],
  )

  // Breathing room around the line: a little above (for the max label) and more below
  // (for the min label, and so the line stays clear of the rain bars). suggestedMin/Max
  // only widen the axis; Chart.js still rounds it to nice numbers.
  const options = useMemo<ChartOptions<Mixed>>(() => {
    const temps = hourly.temperature_2m.slice(startIndex, end)
    const low = Math.min(...temps)
    const high = Math.max(...temps)
    const range = high - low || 1
    return {
      ...baseOptions,
      scales: {
        ...baseOptions.scales,
        temp: { ...baseOptions.scales?.temp, suggestedMin: low - range * 0.35, suggestedMax: high + range * 0.15 },
      },
    }
  }, [hourly, startIndex, end])

  return (
    <div>
      {/* HTML legend instead of Chart.js's: easier to style, and the temperature key shows the color scale. */}
      <div className="mb-2 flex items-center gap-4 text-[11px] text-slate-400" aria-hidden>
        <span className="flex items-center gap-1.5">
          <span className="h-1 w-5 rounded-full" style={{ background: temperatureGradientCss() }} />
          Temperature
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-sky-400/60" />
          Chance of rain
        </span>
      </div>
      {/* Chart.js needs a sized parent when maintainAspectRatio is false. */}
      <div className="h-52" role="img" aria-label={`Temperature and chance of rain for the next ${hours} hours`}>
        <Chart type="bar" data={data} options={options} plugins={[crosshairPlugin, dayLinesPlugin, extremesPlugin]} />
      </div>
    </div>
  )
}

/* ---------- Line styling (scriptable options: Chart.js calls them while drawing) ---------- */

/**
 * The line's color follows the temperature: a vertical gradient that maps each height
 * on the chart to the temperature at that height, using the map's color scale.
 * The gradient needs the chart's size, which only exists after the first layout.
 */
function temperatureStroke(ctx: ScriptableContext<'line'>) {
  return verticalTemperatureGradient(ctx, 1, 1)
}

/** Same colors, fading from 20% at the line to transparent at the bottom (light enough to see the rain bars). */
function temperatureFill(ctx: ScriptableContext<'line'>) {
  return verticalTemperatureGradient(ctx, 0.2, 0)
}

function verticalTemperatureGradient(ctx: ScriptableContext<'line'>, topAlpha: number, bottomAlpha: number) {
  const { chart } = ctx
  const { chartArea } = chart
  const scale = chart.scales.temp
  if (!chartArea || !scale) return 'transparent' // first render, before layout

  const gradient = chart.ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top)
  // Sample the visible temperature range (plus the color stops inside it) and add a color stop for each.
  const temps = [scale.min, scale.max, ...TEMPERATURE_STOPS.map(([t]) => t)].filter(
    (t) => t >= scale.min && t <= scale.max,
  )
  for (const t of temps) {
    const position = (scale.getPixelForValue(t) - chartArea.bottom) / (chartArea.top - chartArea.bottom)
    const alpha = bottomAlpha + (topAlpha - bottomAlpha) * position
    gradient.addColorStop(Math.min(Math.max(position, 0), 1), temperatureColor(t, alpha))
  }
  return gradient
}

/** Index of the highest and lowest value (the first one if several hours tie). */
function extremes(values: number[]) {
  let max = 0
  let min = 0
  values.forEach((v, i) => {
    if (v > values[max]) max = i
    if (v < values[min]) min = i
  })
  return { max, min }
}

function extremePointRadius(ctx: ScriptableContext<'line'>) {
  const { max, min } = extremes(ctx.dataset.data as number[])
  return ctx.dataIndex === max || ctx.dataIndex === min ? 4 : 0
}

/* ---------- Small plugins: things Chart.js doesn't draw on its own ---------- */

/** "22°" above the highest point and "11°" below the lowest. */
const extremesPlugin: Plugin<Mixed> = {
  id: 'extremes',
  afterDatasetsDraw(chart) {
    const meta = chart.getDatasetMeta(0)
    const values = chart.data.datasets[0].data as number[]
    if (!values.length) return
    const { max, min } = extremes(values)
    const { ctx } = chart

    ctx.save()
    ctx.font = `600 11px ${ChartJS.defaults.font.family}`
    ctx.textAlign = 'center'
    ctx.fillStyle = '#f1f5f9'
    const draw = (i: number, dy: number) => {
      const point = meta.data[i]
      if (point) ctx.fillText(`${Math.round(values[i])}°`, point.x, point.y + dy)
    }
    draw(max, -10)
    if (min !== max) draw(min, 18)
    ctx.restore()
  },
}

/** A dashed line at each midnight, with the new day's name at the top. */
const dayLinesPlugin: Plugin<Mixed> = {
  id: 'dayLines',
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea, scales } = chart
    const labels = chart.data.labels as string[]

    ctx.save()
    ctx.font = `600 10px ${ChartJS.defaults.font.family}`
    ctx.textAlign = 'left'
    labels.forEach((time, i) => {
      if (i === 0 || formatHour(time) !== '00:00') return
      const x = scales.x.getPixelForValue(i)
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)'
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(x, chartArea.top)
      ctx.lineTo(x, chartArea.bottom)
      ctx.stroke()
      ctx.fillStyle = TICK_COLOR
      ctx.fillText(formatWeekday(time.slice(0, 10)), x + 4, chartArea.top + 10)
    })
    ctx.restore()
  },
}

/* ---------- Options ---------- */

const baseOptions: ChartOptions<Mixed> = {
  responsive: true,
  maintainAspectRatio: false,
  // Room above the highest point for its label.
  layout: { padding: { top: 14 } },
  // Hovering anywhere in a column shows both values for that hour.
  interaction: { mode: 'index', intersect: false },
  plugins: {
    // Chart.js registration is GLOBAL: the compare chart registers the Legend plugin,
    // so hide it here explicitly (this chart has its own HTML legend).
    legend: { display: false },
    tooltip: {
      ...tooltipTheme,
      callbacks: {
        title: (items) => {
          const time = items[0].label
          return `${formatWeekday(time.slice(0, 10))} ${formatHour(time)}`
        },
        label: (ctx) =>
          ctx.dataset.yAxisID === 'rain'
            ? ` Chance of rain  ${ctx.parsed.y}%`
            : ` Temperature  ${ctx.parsed.y?.toFixed(1)}°C`,
        // The tooltip marker: a circle in the temperature's color / the rain blue.
        labelColor: (ctx) => {
          const color = ctx.dataset.yAxisID === 'rain' ? '#38bdf8' : temperatureColor(Number(ctx.raw))
          return { borderColor: color, backgroundColor: color }
        },
      },
    },
  },
  scales: {
    x: {
      // Every 6 hours: "06", "12", "18". Midnight is marked by the day line instead.
      ticks: {
        color: TICK_COLOR,
        autoSkip: false,
        maxRotation: 0,
        font: { size: 10 },
        callback(_value, index) {
          const hour = formatHour(this.getLabelForValue(index))
          return ['06:00', '12:00', '18:00'].includes(hour) ? hour.slice(0, 2) : ''
        },
      },
      grid: { display: false },
      border: { display: false },
    },
    temp: {
      type: 'linear',
      position: 'left',
      beginAtZero: false, // a 'bar' chart starts value axes at 0 by default; temperatures shouldn't
      ticks: { color: TICK_COLOR, font: { size: 10 }, maxTicksLimit: 5, callback: (v) => `${v}°` },
      grid: { color: GRID_COLOR },
      border: { display: false },
    },
    rain: {
      type: 'linear',
      position: 'right',
      min: 0,
      max: 100,
      ticks: { color: TICK_COLOR, font: { size: 10 }, stepSize: 50, callback: (v) => `${v}%` },
      grid: { display: false },
      border: { display: false },
    },
  },
}
