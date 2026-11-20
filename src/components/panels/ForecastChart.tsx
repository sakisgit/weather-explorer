import {
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  type ChartData,
  type ChartOptions,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import { useMemo } from 'react'
import { Chart } from 'react-chartjs-2'
import type { HourlyWeather } from '../../api/types'
import { formatHour } from '../../utils/format'

/*
 * Chart.js is tree-shakeable: we register only the pieces we use
 * (line + bar, two linear axes, tooltip) instead of the whole library.
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
  Legend,
  Tooltip,
)

interface Props {
  hourly: HourlyWeather
  /** Index of the current hour in the hourly arrays. */
  startIndex: number
  hours?: number
}

/**
 * Next 48 hours: temperature as a line (left axis) and
 * chance of rain as bars (right axis, 0-100%).
 * Two series with different units = two y axes.
 */
export function ForecastChart({ hourly, startIndex, hours = 48 }: Props) {
  // Only rebuild the chart data when the forecast actually changes.
  const data = useMemo<ChartData<'bar' | 'line', number[], string>>(() => {
    const end = startIndex + hours
    return {
      labels: hourly.time.slice(startIndex, end).map(formatHour),
      datasets: [
        {
          type: 'line',
          label: 'Temperature (°C)',
          data: hourly.temperature_2m.slice(startIndex, end),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          yAxisID: 'temp',
        },
        {
          type: 'bar',
          label: 'Chance of rain (%)',
          data: hourly.precipitation_probability.slice(startIndex, end),
          backgroundColor: 'rgba(56, 189, 248, 0.45)',
          yAxisID: 'rain',
        },
      ],
    }
  }, [hourly, startIndex, hours])

  return (
    // Chart.js needs a sized parent when maintainAspectRatio is false.
    <div className="h-52" role="img" aria-label={`Temperature and chance of rain for the next ${hours} hours`}>
      <Chart type="bar" data={data} options={options} />
    </div>
  )
}

const GRID = 'rgba(148, 163, 184, 0.12)'
const TICKS = '#94a3b8'

const options: ChartOptions<'bar' | 'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  // Hovering anywhere in a column shows both values for that hour.
  interaction: { mode: 'index', intersect: false },
  plugins: {
    // Chart.js registration is GLOBAL: once any chart registers the Legend plugin
    // (the compare chart does), every chart shows a legend. Style it explicitly here.
    legend: {
      labels: { color: '#cbd5e1', boxWidth: 10, boxHeight: 10, font: { size: 11 } },
    },
    tooltip: {
      callbacks: {
        label: (ctx) =>
          ctx.dataset.yAxisID === 'rain' ? ` Rain: ${ctx.parsed.y}%` : ` Temp: ${ctx.parsed.y?.toFixed(1)}°C`,
      },
    },
  },
  scales: {
    x: {
      ticks: { color: TICKS, maxTicksLimit: 8, maxRotation: 0 },
      grid: { display: false },
    },
    temp: {
      type: 'linear',
      position: 'left',
      ticks: { color: TICKS, callback: (v) => `${v}°` },
      grid: { color: GRID },
    },
    rain: {
      type: 'linear',
      position: 'right',
      min: 0,
      max: 100,
      ticks: { color: TICKS, callback: (v) => `${v}%`, stepSize: 50 },
      grid: { display: false },
    },
  },
}
