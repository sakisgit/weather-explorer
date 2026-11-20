import {
  CategoryScale,
  Chart as ChartJS,
  type ChartData,
  type ChartOptions,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import type { CompareResponse } from '../../api/types'
import type { Place } from '../../types'
import { formatWeekday } from '../../utils/format'
import { GRID_COLOR, TICK_COLOR, crosshairPlugin, tooltipTheme } from './chartTheme'

ChartJS.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Legend, Tooltip)

/** Distinct colors for up to 12 places (one per line). */
const SERIES_COLORS = [
  '#38bdf8',
  '#f59e0b',
  '#a78bfa',
  '#34d399',
  '#f472b6',
  '#facc15',
  '#fb923c',
  '#60a5fa',
  '#4ade80',
  '#e879f9',
  '#f87171',
  '#2dd4bf',
]

interface Props {
  rows: Array<{ place: Place; forecast: CompareResponse }>
}

/**
 * One line per saved place: the daily HIGH for the next 7 days.
 * Answers "where will it be warmest this week?" at a glance.
 */
export function CompareChart({ rows }: Props) {
  const data = useMemo<ChartData<'line', number[], string>>(
    () => ({
      // Days are local per place; using the first place's dates as labels is fine for a weekly view.
      labels: rows[0]?.forecast.daily.time.map((d, i) => (i === 0 ? 'Today' : formatWeekday(d))) ?? [],
      datasets: rows.map(({ place, forecast }, i) => ({
        label: place.name,
        data: forecast.daily.temperature_2m_max,
        borderColor: SERIES_COLORS[i % SERIES_COLORS.length],
        backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length],
        borderWidth: 2.5,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBorderColor: '#0f172a', // dark ring, so overlapping points stay distinct
        pointBorderWidth: 2,
      })),
    }),
    [rows],
  )

  return (
    <div className="h-56" role="img" aria-label="Daily high temperature for the next 7 days, per saved place">
      <Line data={data} options={options} plugins={[crosshairPlugin]} />
    </div>
  )
}

const options: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      position: 'bottom',
      // Round markers, like the points on the lines
      labels: {
        color: '#cbd5e1',
        usePointStyle: true,
        pointStyle: 'circle',
        boxWidth: 7,
        boxHeight: 7,
        padding: 12,
        font: { size: 11 },
      },
    },
    tooltip: {
      ...tooltipTheme,
      // Warmest place first, so the tooltip reads as a ranking for that day.
      itemSort: (a, b) => (b.parsed.y ?? 0) - (a.parsed.y ?? 0),
      callbacks: { label: (ctx) => ` ${ctx.dataset.label}  ${Math.round(ctx.parsed.y ?? 0)}°C` },
    },
  },
  scales: {
    x: { ticks: { color: TICK_COLOR, font: { size: 10 } }, grid: { display: false }, border: { display: false } },
    y: {
      grace: '10%',
      ticks: { color: TICK_COLOR, font: { size: 10 }, maxTicksLimit: 5, callback: (v) => `${v}°` },
      grid: { color: GRID_COLOR },
      border: { display: false },
    },
  },
}
