import { Chart as ChartJS, type Plugin, type TooltipOptions } from 'chart.js'

/*
 * Shared look for both charts, so they read as one design:
 * the app's font, a dark tooltip card and a crosshair line.
 */

// Chart.js draws on a <canvas>, which doesn't inherit CSS fonts: give it the app's (Tailwind's) font.
ChartJS.defaults.font.family =
  'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'

export const TICK_COLOR = '#94a3b8' // slate-400
export const GRID_COLOR = 'rgba(148, 163, 184, 0.1)'

/** Dark card tooltip, like the rest of the UI (slate-900 with a slate-700 border). */
export const tooltipTheme: Partial<TooltipOptions<'bar' | 'line'>> = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  borderColor: '#334155',
  borderWidth: 1,
  cornerRadius: 8,
  padding: 10,
  titleColor: '#f1f5f9',
  titleFont: { weight: 600, size: 12 },
  titleMarginBottom: 6,
  bodyColor: '#cbd5e1',
  bodyFont: { size: 12 },
  bodySpacing: 4,
  usePointStyle: true, // round color markers instead of squares
  boxWidth: 8,
  boxHeight: 8,
  boxPadding: 6,
  caretSize: 0,
}

/**
 * Crosshair: a vertical line at the hovered column, so it's clear which hour or day
 * the tooltip describes. A tiny Chart.js plugin: after the data is drawn, if the
 * tooltip is showing, draw a line at its x position.
 */
export const crosshairPlugin: Plugin<'bar' | 'line'> = {
  id: 'crosshair',
  afterDatasetsDraw(chart) {
    const active = chart.tooltip?.getActiveElements()
    if (!active?.length) return
    const { ctx, chartArea } = chart
    const x = active[0].element.x
    ctx.save()
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.35)'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(x, chartArea.top)
    ctx.lineTo(x, chartArea.bottom)
    ctx.stroke()
    ctx.restore()
  },
}
